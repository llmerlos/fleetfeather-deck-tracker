import React from 'react';
import './App.css';

const { ipcRenderer } = window.require("electron");


function Card(props) {
    console.log()
    return (
        <div className = "card" onClick={props.onClick}>
            {props.code} / {props.name} / {props.qtt} / {props.qtr}
        </div>
    )
}

class Deck extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            deck: [{code: 0, info: {}, qtt: 0, qtr: 0}]
        }
    }

    componentDidMount() {
        ipcRenderer.on('INITIALIZE_DECK', (event, deck) => {
            this.setState({ deck });
        });
      }

    renderCard(i) {
        return (
            <Card
                key={i}
                code={this.state.deck[i].code}
                name={this.state.deck[i].info.name}
                qtt={this.state.deck[i].qtt}
                qtr={this.state.deck[i].qtr}
                onClick={() => {
                    console.log(i)}}
            />
        )
    }

    render() {
        const cards = []

        for(let i = 0; i < this.state.deck.length; i++) {
            cards.push(this.renderCard(i))
            console.log(cards[i])
        }

        return (
            <div className = "deck">
                {cards}
            </div>
        )
    }
}

export default Deck;