import React, {Component} from 'react';
import '../App.css';
import axios from 'axios';
import Image from './image.jsx';
import frontVariables from '../privateKeys/frontVariables.js'
import { BarLoader } from 'react-spinners';


//const googleCustomSearchURL = "%20clipart&imgColorType=gray&imgType=clipart&searchType=image&imgDominantColor=black&fileType=jpg"
const googleCustomSearchURL = "%20clipart&imgColorType=gray&imgType=clipart&searchType=image&imgDominantColor=black"
const URL = "https://www.googleapis.com/customsearch/v1?key="+frontVariables.key+"&cx=004485904051950933441:5x_3_wemizq&q="
//const URL = "https://www.googleapis.com/customsearch/v1?key="+process.env.REACT_APP_CUSTOM_SEARCH+"&cx=004485904051950933441:5x_3_wemizq&q="
const serverURL = "http://localhost:3333"

class Search extends Component {

    constructor(props) {
      super(props)
      this.state = {
        query:"",
        images:[],
        full: false,
        predictions:[],
        loading: false,
        predictionsMade: 0,
        selectedURL: ""
      }
      this.predictAutoML = this.predictAutoML.bind(this)
      this.compare = this.compare.bind(this)
      this.selectImage = this.selectImage.bind(this)
      this.deselectImage = this.deselectImage.bind(this)
    }

    selectImage(url){
      console.log("Select called")
      this.setState({
        selectedURL: url
      });
    }
    deselectImage(){
      this.setState({
        selectedURL: ""
      });
    }

    getSearchResults() {
      //For testing
    /*  this.setState({
        predictions: [{
          "url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJo9fjr9iANo0QuhEKtSUlAOie15cwbfV--5lEHZhH9DUpyDqPQRi2A3Y",
          "score": 0.999,
          "label": "negative"
        },{
          "url": "http://simplephotoshop.com/elementsplus/px/deselect-path-dia.png",
          "score": 0.999,
          "label": "negative"
        },{
          "url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJo9fjr9iANo0QuhEKtSUlAOie15cwbfV--5lEHZhH9DUpyDqPQRi2A3Y",
          "score": 0.999,
          "label": "negative"
        },{
          "url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJo9fjr9iANo0QuhEKtSUlAOie15cwbfV--5lEHZhH9DUpyDqPQRi2A3Y",
          "score": 0.999,
          "label": "negative"
        },{
          "url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJo9fjr9iANo0QuhEKtSUlAOie15cwbfV--5lEHZhH9DUpyDqPQRi2A3Y",
          "score": 0.999,
          "label": "negative"
        },{
          "url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJo9fjr9iANo0QuhEKtSUlAOie15cwbfV--5lEHZhH9DUpyDqPQRi2A3Y",
          "score": 0.999,
          "label": "negative"
        },{
          "url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJo9fjr9iANo0QuhEKtSUlAOie15cwbfV--5lEHZhH9DUpyDqPQRi2A3Y",
          "score": 0.999,
          "label": "negative"
        },{
          "url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJo9fjr9iANo0QuhEKtSUlAOie15cwbfV--5lEHZhH9DUpyDqPQRi2A3Y",
          "score": 0.999,
          "label": "negative"
        }],
        full: true,
        images:[],
        loading: false
      });
      return;*/

      console.log("Function called")
      this.setState({
        predictions:[],
        loading: true
      });
    axios.get(URL+this.state.query+googleCustomSearchURL).then(response => {
      if(response.data.items) {
        var links =[]
        for(var i = 0; i < response.data.items.length; i++) {
          //Call one by one.
          this.predictAutoML(response.data.items[i].image.thumbnailLink)
          links.push(response.data.items[i].image.thumbnailLink)
        }

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



  predictAutoML(link) {
    var config = {
      headers: {'Content-type': 'application/json'}
    };
    var body = {
    	"link": link
    }
    //console.log("Predict")
    axios.post(serverURL+"/predict", body, config)
    .then(response => {
      var predictionsCount = this.state.predictionsMade;
      predictionsCount ++;
      this.setState({
        predictionsMade: predictionsCount
      });
      //Add response to all responses and sort again.
      var currentPredictions = this.state.predictions;
      currentPredictions.push(response.data.predictions);
      var predictionsSorted = currentPredictions.filter(function(n){ return n != undefined });
      if(predictionsSorted.length >0){
        predictionsSorted.sort(this.compare)
      } else{
        if(this.state.predictionsMade == 10){
          alert("There was an error processing your search. Wait a few seconds and try again.")
          this.setState({
            predictionsMade: 0
          });
        }
      }
      this.setState({
        predictions: predictionsSorted,
        full: true,
        images:[],
        loading: false
      });
    }).catch((error)=>{
      console.log(error)
      var predictionsCount = this.state.predictionsMade;
      predictionsCount ++;
      this.setState({
        predictionsMade: predictionsCount
      });
      if(this.state.predictionsMade == 10){
        alert("There was an error processing your search. Wait a few seconds and try again.")
        this.setState({
          predictionsMade: 0,
          loading:false
        });
      }
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
                  if(pre != null){
                    if(pre.score != null){
                      if(pre.url === this.state.selectedURL){
                        return <Image key={index} prediction={pre} select={this.selectImage} selectedBool={true} deselect={this.deselectImage} />
                      } else{
                        return <Image key={index} prediction={pre} select={this.selectImage} selectedBool={false} deselect={this.deselectImage} />
                      }
                    }
                  }
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
