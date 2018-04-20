import React, {Component} from 'react';
import '../App.css';

class Image extends Component {

    constructor(props) {
        super(props);
        this.state = {
          selected: false,
          selectedOption: ""
        }

        this.radioButton = this.radioButton.bind(this);
    }

    radioButton(event){
      this.setState({
        selectedOption: event.target.value
      });
    }

    componentDidMount() {
    console.log('GrandChild did mount.');
    if(this.props.prediction.label === "positive"){
      var negative = 1 - this.props.prediction.score
      negative = negative.toFixed(3);
      this.setState({
        positive: this.props.prediction.score,
        negative: negative
      })

    }else{
      var positive = 1 - this.props.prediction.score
      positive = positive.toFixed(3);
      this.setState({
        negative: this.props.prediction.score,
        positive: positive
      })
    }
  }


// yellow FFF2CC   red: F8CECC

//this.props.image.image.thumbnailLink
    render() {

      //console.log(this.props.prediction)
      var backColor = "";
      var quality = ""
      if(this.props.prediction.score >= 0.9 && this.props.prediction.label === "positive") {
        backColor = {backgroundColor: "#D5E8D4", color: "#4E4E4E"};
        quality = "Good"
      } else if(this.props.prediction.score >= 0.75 && this.props.prediction.label === "positive") {
        backColor = {backgroundColor: "#FFF2CC", color: "#4E4E4E"};
        quality = "Fair"
      } else {
        backColor = {backgroundColor: "#F8CECC", color: "#4E4E4E"}
        quality = "Bad"
      }
      var negative = 0
      var positive = 0
      if(this.props.prediction.label === "positive"){
        negative = 1 - this.props.prediction.score;
        negative = negative.toFixed(3);
        positive = this.props.prediction.score;
      }else{
        positive = 1 - this.props.prediction.score;
        positive = positive.toFixed(3);
        negative = this.props.prediction.score;
      }
      var selected = this.props.selectedBool;
        return (
          <div>
            {selected ? (
              <div className='col-md-12 box'>
                <div className='col-md-2'>
                  <img alt={this.props.text} className="img-responsive img" src={this.props.prediction.url} onClick={()=>{this.props.deselect()}}></img>
                  <p style={backColor}>{quality}</p>
                </div>
                <div className='col-md-5'>
                  <h4>Score Received</h4>
                  <p>Positive {positive}</p>
                  <p>Negative {negative}</p>
                </div>
                <div className='col-md-5'>
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
                  <button onClick={console.log("Called")} type="button" className="btn-primary pull-right"> Send</button>
                </div>
              </div>)
              :(
              <div className='col-md-2'>
                <img alt={this.props.text} className="img-responsive img" src={this.props.prediction.url} onClick={() => {this.props.select(this.props.prediction.url)}}></img>
                <p style={backColor}>{quality}</p>
              </div>)
            }
          </div>
        );
    }
}
export default Image;
