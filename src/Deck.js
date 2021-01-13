import React from 'react';
import './Deck.css';

const { ipcRenderer } = window.require("electron");

function Card(props) {
    var color = "#6B6964"
    var borderweight = ""
    if (props.info.type === "Spell"){
        if(props.info.spellSpeedRef === "Burst"){
            color = "#5AD7EF"
        } else if (props.info.spellSpeedRef === "Fast"){
            color = "#F7C321"
        } else if (props.info.spellSpeedRef === "Slow"){
            color = "#AC42D2"
        }
    } else if(props.info.supertype === "Champion"){
        color = "#FAE36E"
        borderweight = "medium"
    }

    let bg= {"background-image": "linear-gradient(to right, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2) ), url("+props.info.assets[0].fullAbsolutePath+")",
             "opacity": (props.qtr > 0 ? 1 : 0.5)}
    let scost = {"border-color": color, "border-width": borderweight}
    let sregion = {"border-color": color, "border-width": borderweight, "background-image": "url("+props.info.assets[0].region+")"}
    let sname = {"border-color": color, "border-width": borderweight}
    let sqt = {"border-color": color, "border-width": borderweight}

    return (
        <div className = "cardprev" onClick={props.onclick} onContextMenu={props.oncontextmenu} style={bg}>
            <div className="cardcost" style={scost}>{props.info.cost}</div>
            <div className="cardregion" style={sregion}></div>
            <div className="cardname" style={sname}>{props.info.name}</div>
            <div className="cardqt" style={sqt}>{props.qtr}/{props.qtt}</div>
        </div>
    )
}

class Deck extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            loaded: false,
            deck: []
        }
        this.changeCard = this.changeCard.bind(this)
    }

    componentDidMount() {
        ipcRenderer.on('INITIALIZE_DECK', (event, deck) => {
            this.setState(() => {
                return {
                    deck: deck,
                    loaded: true
                }
            });
            console.log(deck)
        });

        ipcRenderer.on('UPDATE_DECK', (event, up) => {
            for(let i=0; i<up.length; i++){
                this.changeCard(up[i].code, up[i].qtu)
            }
        });
    }

    changeCard(code, add) {
        let deck = this.state.deck
        let ndeck = deck.map((card) => {
            if (card.code === code){
                return {...card, qtr: (card.qtr+add > 0 ? card.qtr+add : 0) }
            } else {
                return card
            }
        })
        this.setState(() => {
            return {
                deck: ndeck,
                loaded: true
            }
        });
    }

    render() {
        let cards = this.state.deck
        console.log("rendering")

        if (this.state.loaded) {
            return (
                <div className = "deck">
                    {cards.map( (card) => (
                        <Card
                            key={card.code}
                            info={card.info}
                            qtt={card.qtt}
                            qtr={card.qtr}
                            onclick={() => {this.changeCard(card.code, 1)}}
                            oncontextmenu={() => {this.changeCard(card.code, -1)}}
                        />
                    ))}
                </div>
            )
        } else {
            return (
                <div className = "deck">
                    Waiting for deck
                </div>
            )
        }
    }
}

export default Deck;