import React from 'react';
import './App.css';
import Deck from './Deck';

class App extends React.Component {
  constructor() {
    super();
    this.state = {};
  }

  render() {
    return (
      <div className="App">
        <Deck/>
      </div>
    );
  }
}

export default App;
