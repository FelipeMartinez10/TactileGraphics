import React, {Component} from 'react';
import axios from 'axios';
import '../App.css';

class Image extends Component {

    constructor(props) {
        super(props);
        this.state = {
        }
    }

// yellow FFF2CC   red: F8CECC

//this.props.image.image.thumbnailLink
    render() {
      console.log(this.props.prediction)
      var backColor = "";
      var quality = ""
      if(this.props.prediction.score >= 0.85) {
        backColor = {backgroundColor: "#D5E8D4", color: "#4E4E4E"};
        quality = "Good"
      } else if(this.props.prediction.score >= 0.60) {
        backColor = {backgroundColor: "#FFF2CC", color: "#4E4E4E"};
        quality = "Fair"
      } else {
        backColor = {backgroundColor: "#F8CECC", color: "#4E4E4E"}
        quality = "Bad"
      }
        return (
            <div className='col-md-2'>
              <img alt={this.props.text} className="img-responsive img" src={this.props.prediction.url}></img>
              <p style={backColor}>{quality}</p>
            </div>
        );
    }
}
export default Image;
