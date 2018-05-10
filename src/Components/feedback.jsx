import React, {Component} from 'react';
import '../App.css';
import axios from 'axios';

const serverURL = "http://localhost:3333";

class Feedback extends Component {

    constructor(props) {
        super(props);

        this.state ={
          feedback: ""
        }
        this.sendFeedback = this.sendFeedback.bind(this);
    }

    sendFeedback() {
      if(this.state.feedback === ""){
        return;
      }
      var config = {
        headers: {'Content-type': 'application/json'}
      };
      var body = {
        "feedback": this.state.feedback
      }
      axios.post(serverURL+"/feedback", body, config)
      .then(response => {
        console.log(response);
        //Maybe alert and close
        if(response.data === "OK"){
          alert("Thank you for your feedback");
          this.setState({
            feedback: ""
          });
        }
      }).catch((error)=>{
        console.log(error);
      });
    }

    render() {
        return (
          <div>
            <div className="row">
              <h4>Feedback</h4>
            </div>
            <div className="row margin-top">
              <textarea rows="10" cols="100" placeholder="Add your comments here" onChange={(event) => {
                   this.setState({
                     feedback: event.target.value
                   });
                 }}>
              </textarea>
            </div>
            <div className="row">
              <div className="col-md-2"></div>
              <div className="col-md-4">
                <button onClick={() => {this.props.close()}} type="button" className="btn-warning">
                  Close
                </button>
              </div>
              <div className="col-md-4">
                <button onClick={() => {this.sendFeedback()}} type="button" className="btn-success">
                  Send Comments
                </button>
              </div>
              <div className="col-md-2"></div>

            </div>
          </div>
        );
    }
}
export default Feedback;
