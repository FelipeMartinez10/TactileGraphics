import React, { Component } from 'react';
import './App.css';
import Search from './Components/search.jsx';

class App extends Component {

  render() {
    return (
      <div className="App container">
        <div className= "row">
          <div className="col-md-3"></div>
          <div className="col-md-6">
            <h1>Search Tactile Graphics</h1>
          </div>
          <div className="col-md-3"></div>
        </div>
        <Search></Search>

      </div>
    );
  }
}

export default App;
