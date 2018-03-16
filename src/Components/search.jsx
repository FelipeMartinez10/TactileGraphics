import React, {Component} from 'react';
import '../App.css';
import axios from 'axios';
import Image from './image.jsx';
import frontVariables from '../privateKeys/frontVariables.js'
import { BarLoader } from 'react-spinners';

const URL = "https://www.googleapis.com/customsearch/v1?key="+frontVariables.key+"&cx=004485904051950933441:5x_3_wemizq&q="
const serverURL = "http://localhost:3333"

class Search extends Component {

    constructor(props) {
      super(props)
      this.state = {
        query:"",
        images:[],
        full: false,
        predictions:[],
        loading: false
      }
      this.predictAutoML = this.predictAutoML.bind(this)
      this.compare = this.compare.bind(this)
    }


    getSearchResults() {
      console.log("Function called")
      this.setState({
        predictions:[],
        loading: true
      });

      //   For testing:
    /*  this.setState({
        images: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDHWbQUlc0weTkX-dBHcDVNMcdPkCFF9jKsOfRFMjpYJXbRtKwXhA3zQ",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDHWbQUlc0weTkX-dBHcDVNMcdPkCFF9jKsOfRFMjpYJXbRtKwXhA3zQ"]
      },() => {
        this.predictAutoML(this.state.images)
      });
*/


    //  this.predictAutoML(this.state.images)

      //fileType=png

    axios.get(URL+this.state.query+"%20clipart&imgColorType=gray&imgType=clipart&searchType=image&imgDominantColor=black&fileType=jpg").then(response => {
      if(response.data.items) {
        var links =[]
        //console.log(response.data.items)
        for(var i = 0; i < response.data.items.length; i++) {
        //for(var i = 0; i < 2; i++) {
          links.push(response.data.items[i].image.thumbnailLink)
          //links.push(response.data.items[i].link)
        }
        this.setState({
          images: links,
          predictions: []
        },() => {
          this.predictAutoML(this.state.images)
        });
      }
      else {
        console.log("Nothing Found")
      }
    }).catch((error)=> {
      console.log(error)
      alert("There was an error processing your search. Wait a few seconds and try again.");
      this.setState({
        loading:false
      });
    });

  }



  predictAutoML(links) {
    var config = {
      headers: {'Content-type': 'application/json'}
    };
    var body = {
    	"links": links
    }
    console.log("Predict")
    axios.post(serverURL+"/predict", body, config)
    .then(response => {
      console.log(response.data.predictions)
      var predictionsSorted = response.data.predictions
      if(response.data.predictions.length >0){
        predictionsSorted.sort(this.compare)
      } else{
        alert("There was an error processing your search. Wait a few seconds and try again.")
      }
      this.setState({
        predictions: predictionsSorted,
        full: true,
        images:[],
        loading: false
      });
    }).catch((error)=>{
      console.log(error)
      alert("There was an error processing your search. Wait a few seconds and try again.");
      this.setState({
        loading:false
      });

    });
  }

  compare(a,b) {
    var scoreA = a.score
    var scoreB = b.score
    if (a.label === "negative"){
      scoreA = 1 - scoreA;
    }
    if (b.label === "negative"){
      scoreB = 1 - scoreB;
    }
    if (scoreA < scoreB){
      return 1;
    }
    if (scoreA > scoreB){
      return -1;
    }
    return 0;
  }

    render() {
      const isFull = this.state.full
      //console.log(this.state)
        return (
          <div className ="container">
            <div className = "row">
              <div className = "col-md-3"></div>
              <div className = "col-md-6">
                <div className="span12">
                 <form id="custom-search-form" className="form-search form-horizontal" onSubmit={(event) => {
                     event.preventDefault()
                     this.getSearchResults()
                   }}>
                     <div className="input-append span12">
                         <input type="text" className="search-query mac-style" placeholder="Search" onChange={(event) => {
                              this.setState({
                                query: event.target.value
                              });
                            }}>
                        </input>
                         <button onClick={() => this.getSearchResults()} type="button" className="btn-primary">
                           <span className="glyphicon glyphicon-search" aria-hidden="true"></span>
                             Search
                          </button>
                     </div>
                 </form>
                </div>
              </div>
              <div className = "col-md-3"></div>
            </div>
            <div className="row">
              <hr className="divisor"></hr>
              <div className="col-md-2"></div>
              <div className="col-md-8">
                {isFull ? (this.state.predictions.map((pre, index) =>{
                  return <Image key={index} prediction={pre} />
                }) )
              : (<p></p>)}
              <div id='loader'>
                <BarLoader
                    color={'#337ab7'}
                    loading={this.state.loading}
                  />
              </div>
              </div>
              <div className="col-md-2"></div>
            </div>
          </div>

        );
    }
}
export default Search;
