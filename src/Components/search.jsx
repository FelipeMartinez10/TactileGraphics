import React, {Component} from 'react';
import '../App.css';
import axios from 'axios';
import Image from './image.jsx';
import Feedback from './feedback.jsx';
import frontVariables from '../privateKeys/frontVariables.js'
import { BarLoader, SyncLoader } from 'react-spinners';

//Socket config
import socketIOClient from 'socket.io-client'



//const googleCustomSearchURL = "%20clipart&imgColorType=gray&imgType=clipart&searchType=image&imgDominantColor=black&fileType=jpg"
const googleCustomSearchURL = "%20simple%20clipart&imgColorType=gray&searchType=image&imgDominantColor=gray&imgDominantColor=black"
//const URL = "https://www.googleapis.com/customsearch/v1?key="+frontVariables.key+"&cx=004485904051950933441:5x_3_wemizq&q="
const URL = "https://www.googleapis.com/customsearch/v1?key="+frontVariables.key+"&cx=004485904051950933441:vo-2_mjws-q&q="
//const URL = "https://www.googleapis.com/customsearch/v1?key="+process.env.REACT_APP_CUSTOM_SEARCH+"&cx=004485904051950933441:5x_3_wemizq&q="
const serverURL = "http://localhost:3333"
const socket = socketIOClient(serverURL);

class Search extends Component {

    constructor(props) {
      super(props)
      this.state = {
        query:"",
        images:[],
        full: false,
        predictions:[],
        loading: false,
        sendingImage: false,
        predictionsMade: 0,
        selectedURL: "",
        selectedBool: false,
        selectedPrediction: {},
        selectedOption: "",
        testYourOwn: false,
        data_uri: "",
        filename: "",
        filetype: "",
        customPredictionMade: false,
        customPrediction:{},
        sendFeedback: false,
        base64ToDownload:"",
        connectedToServer: true
      }
      this.predictAutoML = this.predictAutoML.bind(this);
      this.compare = this.compare.bind(this);
      this.selectImage = this.selectImage.bind(this);
      this.deselectImage = this.deselectImage.bind(this);
      this.radioButton = this.radioButton.bind(this);
      this.addImageToModel = this.addImageToModel.bind(this);
      this.uploadToBucket = this.uploadToBucket.bind(this);
      this.imageUpload = this.imageUpload.bind(this);
      this.closeFeedbackSection = this.closeFeedbackSection.bind(this);
      this.toDataURL = this.toDataURL.bind(this);
      this.testTime = this.testTime.bind(this);
      this.predictAutoMLSocket = this.predictAutoMLSocket.bind(this);
    }
    componentDidMount(){
      //var sourceLink ="fix";
      var body = {
        "link": "https://f-martinez11.github.io/personalpage/img/clip.png",
        "sourceLink": "https://f-martinez11.github.io/personalpage/img/clip.png"
      }
      socket.emit('wakeUp');

      var mainThis = this;
      socket.on('connect_error', function() {
        console.log('Failed to connect to server');
        mainThis.setState({connectedToServer: false});
      });
      socket.on('connect', function () {
        mainThis.setState({connectedToServer: true});
      });
      socket.on('response', function(response) {
        console.log(response);
        var extendedResponse = response.predictions;
        //extendedResponse.sourceLink = sourceLink;
        var predictionsCount = mainThis.state.predictionsMade;
        predictionsCount ++;
        mainThis.setState({
          predictionsMade: predictionsCount
        });
        //Add response to all responses and sort again.
        var currentPredictions = mainThis.state.predictions;
        currentPredictions.push(extendedResponse);
        var predictionsSorted = currentPredictions.filter(function(n){ return n !== undefined });
        predictionsSorted = predictionsSorted.filter(function(n){ return n.score !== undefined });
        if(predictionsSorted.length >0){
          predictionsSorted.sort(mainThis.compare)
          mainThis.setState({
            predictions: predictionsSorted,
            full: true,
            images:[],
            loading: false
          });
        } else{
          if(mainThis.state.predictionsMade === 10){
            alert("There was an error processing your search. Wait a few seconds and try again.")
            mainThis.setState({
              predictionsMade: 0,
              loading:false
            });
          }
        }
      });
    }

    testTime(){
      var links = ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJo9fjr9iANo0QuhEKtSUlAOie15cwbfV--5lEHZhH9DUpyDqPQRi2A3Y",
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoGkPcCWoGeDwPRVlN3j7cf6ehjLfU1H0hAtldxb2LJ0u4u4ZPWENBq8s",
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyk1srttufk4Laxf9axjy-EEXIo2FyKBxGpfGqFIAEDlhwjP0rCb5SDjgL",
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0bf0LR6kjmsYkiV0SgKoS-IVs-XAyr7gtHE0gcrHVvNoe6VpfWATVQG-vZw",
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzqcUJPqV0zjlR7iOllNTy3yxoM-kLH6RhHeBf0xZScnm2r0tqjj1ZsyQ",
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRiYVPiE8uUadHv-K6_6pvl5mOt2Y_Mvx-6z3qZQ2gRWpz-s8t0Swg6KB0",
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1bY-3tF6er6yotAGMzirENg-dmUyh0nR0OpjH37poDPRgJA4mHukpq0c",
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJo9fjr9iANo0QuhEKtSUlAOie15cwbfV--5lEHZhH9DUpyDqPQRi2A3Y",
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoGkPcCWoGeDwPRVlN3j7cf6ehjLfU1H0hAtldxb2LJ0u4u4ZPWENBq8s",
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyk1srttufk4Laxf9axjy-EEXIo2FyKBxGpfGqFIAEDlhwjP0rCb5SDjgL",
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0bf0LR6kjmsYkiV0SgKoS-IVs-XAyr7gtHE0gcrHVvNoe6VpfWATVQG-vZw",
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzqcUJPqV0zjlR7iOllNTy3yxoM-kLH6RhHeBf0xZScnm2r0tqjj1ZsyQ",
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRiYVPiE8uUadHv-K6_6pvl5mOt2Y_Mvx-6z3qZQ2gRWpz-s8t0Swg6KB0",
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1bY-3tF6er6yotAGMzirENg-dmUyh0nR0OpjH37poDPRgJA4mHukpq0c"];

          for(var i = 0; i < links.length; i++){
            this.predictAutoMLSocket(links[i],links[i]);
            //break;
          }
    }

    selectImage(prediction){
      console.log("Select called");
      if(prediction.url === this.state.selectedURL){
        this.deselectImage();
      }else{
        this.setState({
          selectedPrediction: prediction,
          selectedURL: prediction.url,
          selectedBool: true,
          selectedOption: ""
        });
      }
    }

    toDataURL(url) {
      console.log("Trying to download image");
      var mainThis = this;
      var xhr = new XMLHttpRequest();
      xhr.onload = function() {
        var reader = new FileReader();
        reader.onloadend = function() {
          //callback(reader.result);
          mainThis.setState({
            base64ToDownload: reader.result
          });
        }
        reader.readAsDataURL(xhr.response);
      };
      xhr.open('GET', url);
      xhr.responseType = 'blob';
      xhr.send();
    }

    deselectImage(){
      this.setState({
        selectedPrediction: {},
        selectedURL: "",
        selectedBool: false
      });
    }
    closeFeedbackSection(){
      this.setState({
        sendFeedback: false
      });
    }
    getSearchResults() {
      if(this.state.query === ""){
        return;
      }
      console.log("Function called")
      this.setState({
        predictions:[],
        loading: true,
        testYourOwn: false,
        data_uri: "",
        sendFeedback:false
      });
      axios.get(URL+this.state.query+googleCustomSearchURL).then(response => {
      if(response.data.items) {
        var links =[]
        for(var i = 0; i < response.data.items.length; i++) {
          //Call one by one.
          this.predictAutoMLSocket(response.data.items[i].image.thumbnailLink,response.data.items[i].link);
          links.push(response.data.items[i].image.thumbnailLink);
          //break;
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

    //return;
    setTimeout(() => {
      axios.get(URL+this.state.query+googleCustomSearchURL+"&start=11").then(response => {
      if(response.data.items) {
        var links =[]
        for(var i = 0; i < response.data.items.length; i++) {
          //Call one by one.
          this.predictAutoMLSocket(response.data.items[i].image.thumbnailLink,response.data.items[i].link);
          links.push(response.data.items[i].image.thumbnailLink);
        }
      }
      else {
        console.log("Nothing Found")
        }
      })
    }, 500)

  }


  predictAutoMLSocket(link, sourceLink) {
    var body = {
      "link": link,
      "sourceLink": sourceLink
    }
    socket.emit('predict', body);
    return;
  }

  predictAutoML(link, sourceLink) {
    var config = {
      headers: {'Content-type': 'application/json'}
    };
    var body = {
    	"link": link
    }
    //console.log("Predict")
    axios.post(serverURL+"/predict", body, config)
    .then(response => {
      console.log(response);
      var extendedResponse = response.data.predictions;
      extendedResponse.sourceLink = sourceLink;
      var predictionsCount = this.state.predictionsMade;
      predictionsCount ++;
      this.setState({
        predictionsMade: predictionsCount
      });
      //Add response to all responses and sort again.
      var currentPredictions = this.state.predictions;
      currentPredictions.push(extendedResponse);
      var predictionsSorted = currentPredictions.filter(function(n){ return n !== undefined });
      predictionsSorted = predictionsSorted.filter(function(n){ return n.score !== undefined });
      if(predictionsSorted.length >0){
        predictionsSorted.sort(this.compare)
        this.setState({
          predictions: predictionsSorted,
          full: true,
          images:[],
          loading: false
        });
      } else{
        if(this.state.predictionsMade === 10){
          alert("There was an error processing your search. Wait a few seconds and try again.")
          this.setState({
            predictionsMade: 0,
            loading:false
          });
        }
      }
    }).catch((error)=>{
      console.log(error)
      var predictionsCount = this.state.predictionsMade;
      predictionsCount ++;
      this.setState({
        predictionsMade: predictionsCount
      });
      if(this.state.predictionsMade === 10){
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

  addImageToModel(){
    console.log(this.state.selectedOption);
    if(this.state.selectedOption === ""){
      alert("You must select a category for the image. Select \"Positive\", if the image is simple enough to be used as a tactile graphic. Otherwise, select \"Negative\". If you are not sure, do not send the image.");
      return
    } else{
      this.setState({
        sendingImage: true
      });
      let imageURL = this.state.selectedPrediction.url;
      let label = this.state.selectedOption;
      this.uploadToBucket(imageURL, label);

    }
  }

  radioButton(event){
    this.setState({
      selectedOption: event.target.value
    });
  }

  uploadToBucket(link, label) {
    var config = {
      headers: {'Content-type': 'application/json'}
    };
    var body = {
      "link": link,
      "label": label
    }
    axios.post(serverURL+"/upload", body, config)
    .then(response => {
      console.log(response);
      if(response.data.upload !== ""){
        this.setState({
          sendingImage: false
        });
        alert("The image was sent to the model. When enough images have been sent, the model will be retrained and improved.");
        this.deselectImage()
      }
    }).catch((error)=>{
      console.log(error);
      this.setState({
        sendingImage: false
      });
    });
  }
  imageUpload(event)
  {
    const reader = new FileReader();
    const file = event.target.files[0];
    reader.onload = (upload) => {
      this.setState({
        data_uri: upload.target.result,
        filename: file.name,
        filetype: file.type
      },()=>{
        var config = {
          headers: {'Content-type': 'application/json'}
        };
        var body = {
          "base64": upload.target.result
        }
        axios.post(serverURL+"/predictCustom", body, config)
        .then(response => {
          console.log(response.data)
          if(response.data.predictions.score){
            this.setState({
              customPredictionMade: true,
              customPrediction: response.data.predictions
            });
          }else{
            this.setState({
              customPredictionMade: false,
              data_uri: ""
            });
            alert('There was an error while testing your image. Wait a few seconds and try again.');
          }
        }).catch(error => {
          console.log(error);
          alert('There was an error while testing your image. Wait a few seconds and try again.');
        });
      });
    };
    if(file){
      reader.readAsDataURL(file);
    }
  }

    render() {
      const sendFeedback = this.state.sendFeedback;
      const isFull = this.state.full;
      const upload = this.state.testYourOwn;
      const customPredictionMade = this.state.customPredictionMade;
      var imageUploaded = false;
      if(this.state.data_uri !== ""){
        imageUploaded = true;
      }
      //console.log(this.state)
      var selected = this.state.selectedBool;
      if(selected){
        var backColor = "";
        var quality = "";
        if(this.state.selectedPrediction.score >= 0.9 && this.state.selectedPrediction.label === "positive") {
          backColor = {backgroundColor: "#D5E8D4", color: "#4E4E4E"};
          quality = "Good";
        } else if(this.state.selectedPrediction.score >= 0.75 && this.state.selectedPrediction.label === "positive") {
          backColor = {backgroundColor: "#FFF2CC", color: "#4E4E4E"};
          quality = "Fair";
        } else {
          backColor = {backgroundColor: "#F8CECC", color: "#4E4E4E"};
          quality = "Bad";
        }
        var negative = 0
        var positive = 0
        if(this.state.selectedPrediction.label === "positive"){
          negative = 1 - this.state.selectedPrediction.score;
          positive = this.state.selectedPrediction.score;
        }else{
          positive = 1 - this.state.selectedPrediction.score;
          negative = this.state.selectedPrediction.score;
        }
        negative = negative.toFixed(3);
        positive = positive.toFixed(3);
      }
      if(customPredictionMade){
        var backColorCustom = "";
        var qualityCustom = "";
        if(this.state.customPrediction.score >= 0.9 && this.state.customPrediction.label === "positive") {
          backColorCustom = {backgroundColor: "#D5E8D4", color: "#4E4E4E"};
          qualityCustom = "Good";
        } else if(this.state.customPrediction.score >= 0.75 && this.state.customPrediction.label === "positive") {
          backColorCustom = {backgroundColor: "#FFF2CC", color: "#4E4E4E"};
          qualityCustom = "Fair";
        } else {
          backColorCustom = {backgroundColor: "#F8CECC", color: "#4E4E4E"};
          qualityCustom = "Bad";
        }
      }
        return (
          <div className ="container">
            <div className = "row">
              <div className = "col-md-3">
                {this.state.connectedToServer ?<div></div>:
                  <div>
                    <h5>The connection to the server was lost, trying to reconnect</h5>
                    <div id='loader'>
                      <SyncLoader
                          color={'#7ec4ff'}
                          loading={!this.state.connectedToServer}
                        />
                    </div>
                  </div>
                }
              </div>
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
              <div className = "col-md-3">
                <button onClick={() => this.setState({testYourOwn: true, sendFeedback:false, full: false})} type="button" className="btn-primary">
                  <span className="glyphicon glyphicon-upload" aria-hidden="true"> </span>
                     Test your own image
                 </button>
              </div>
            </div>
            <div className="row">
              <hr className="divisor"></hr>
              <div className="col-md-2"></div>
              <div className="col-md-8">
                {sendFeedback ?
                  <Feedback close={this.closeFeedbackSection}></Feedback>
                  :
                  <div>
                    <div className="row">
                      {selected ?
                        <div className='col-md-12 box'>
                          <div className='row'>
                            <div className='col-md-2'>
                              <img alt={this.props.text} className="img-responsive img" src={this.state.selectedURL} onClick={this.deselectImage}></img>
                              <p style={backColor}>{quality}</p>
                            </div>
                            <div className='col-md-3'>
                              <h4>Download</h4>
                              <a href={this.state.selectedPrediction.sourceLink} className="btn btn-primary" target="_blank">Source</a>
                            </div>
                            <div className='col-md-3'>
                              <h4>Score Received</h4>
                              <p>Positive {positive}</p>
                              <p>Negative {negative}</p>
                                <div id='loader'>
                                  <BarLoader
                                      color={'#337ab7'}
                                      loading={this.state.sendingImage}
                                    />
                                </div>
                            </div>
                            <div className='col-md-4'>
                              <h4>Reclassify the image</h4>
                                <form>
                                <div className="radio">
                                  <label>
                                    <input type="radio" value="Positive" checked={this.state.selectedOption === 'Positive'}  onChange={this.radioButton}/>
                                    Positive
                                  </label>
                                </div>
                                <div className="radio">
                                  <label>
                                    <input type="radio" value="Negative" checked={this.state.selectedOption === 'Negative'}  onChange={this.radioButton}/>
                                    Negative
                                  </label>
                                </div>
                              </form>
                              <button onClick={this.addImageToModel} type="button" className="btn btn-primary pull-right"> Send</button>
                            </div>
                          </div>
                        </div>
                        :<div></div>}
                    </div>
                    <div className="row">
                      {isFull ? (this.state.predictions.map((pre, index) =>{
                        if(pre !== null && pre !== undefined){
                          if(pre.score !== null){
                            console.log(pre.score);
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
                    <div className="row margin-top">
                      {upload ?
                        <div>
                          {imageUploaded ?
                            <div className="uploader" >
                              <label htmlFor="file-upload" id="file-drag">
                                <div className="row">
                                  <span id="close-glyph" className="glyphicon glyphicon-remove pull-left" aria-hidden="true" onClick={() => {this.setState({testYourOwn: false, data_uri: "",customPredictionMade: false, full:true})}}></span>
                                </div>
                                <div className="row">
                                  <img id="file-image" src={this.state.data_uri} alt="Preview"></img>
                                </div>
                                {customPredictionMade ?
                                  <div className="row margin-top">
                                    <div className='col-md-3'></div>
                                    <div className='col-md-6'>
                                      <p style={backColorCustom}>{qualityCustom}</p>
                                    </div>
                                    <div className='col-md-3'></div>
                                  </div>
                                   :
                                   <div className="row margin-top">
                                     <div id='loader'>
                                       <BarLoader
                                           color={'#337ab7'}
                                           loading={true}
                                         />
                                     </div>
                                   </div>
                                 }
                                <div className="row margin-top">
                                  <button onClick={() => {this.setState({data_uri: "", customPredictionMade: false})}} type="button" className="btn-primary">Test another image</button>
                                </div>
                              </label>
                            </div>
                            :
                            <form id="file-upload-form" className="uploader" onChange={this.imageUpload}>
                              <input id="file-upload" type="file" name="fileUpload" accept="image/*" />
                              <label htmlFor="file-upload" id="file-drag">
                                <div id="start">
                                  <span id="file-upload-btn" className="btn btn-primary">Select an image</span>
                                  <span id="close-glyph" className="glyphicon glyphicon-remove pull-left" aria-hidden="true" onClick={() => {this.setState({testYourOwn: false, data_uri: "", customPredictionMade: false, full:true})}}></span>
                                </div>
                              </label>
                            </form>
                          }
                        </div>
                    : <div></div>}
                    </div>
                    <div className= "row margin-top">
                      <div className="navbar navbar-fixed-bottom">
                        <button onClick={() => {this.setState({sendFeedback:true});}} type="button" className="btn-primary">
                          Send Feedback
                        </button>
                      </div>
                    </div>
                  </div>
                }
              </div>
              <div className="col-md-2"></div>
            </div>
          </div>
        );
    }
}
export default Search;
