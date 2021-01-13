import React from 'react';
import logo from './logo.svg';
import './App.css';
import './Deck'
import Deck from './Deck';
const { ipcRenderer } = window.require("electron");

class App extends React.Component {
  constructor() {
    super();
    this.state = {};
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and don't save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          <button
            type="button"
            className="button"
            onClick={() => {
              console.log("launching")
              ipcRenderer.send("NEW_DECK", 0)}}>
            +
          </button>
        </header>
        <Deck />
      </div>
    );
  }
}

export default App;
