const { ipcRenderer } = window.require("electron");
const axios = require("axios")
const fs = require("fs")
axios.defaults.port=21337

let game;

let sendToUI = (command, payload) => {
    ipcRenderer.send("infoFromApi", { command: command, payload: payload})
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function callApi(apiName){
    try {
        var x = await axios.get('http://localhost:21337/'+apiName)
        return x.data
    } catch {
        return false
    }
}

async function callDD(apiName){
    try {
        var x = await axios.get('http://dd.b.pvp.net/latest/'+apiName)
        return x.data
    } catch {
        return false
    }
}

async function polling() {
    var inGame = false
    var gotDeckCode = false
    var dbready = false
    var version = ""
    while(!dbready){
        [dbready, version] = await getDb();
    }
    sendToUI("db", version)

    while(dbready){
        while(!inGame){
            console.log("Polling for game start")
            let data = await callApi('positional-rectangles')
            if (data.GameState === "InProgress"){
                inGame = true
            } else {
                await timeout(1000)
            }
        }
        while(!gotDeckCode){
            console.log("Polling for deck code")
            let data = await callApi('static-decklist')
            if (data.DeckCode != null){
                gotDeckCode = true
                console.log(data.CardsInDeck)
                sendToUI("deck", data.CardsInDeck)
                game = new Game(data.CardsInDeck)
            } else if (data === false) {
                inGame = false
                break
            } else {
                await timeout(250)
            }

        }

        while(inGame){
            console.log("Polling for game state")
            let data = await callApi('positional-rectangles')
            if (data.GameState !== "InProgress"){
                inGame = false
            } else {
                let up = game.newRectangles(data.Rectangles)
                if (up != null && up.length > 0){
                    console.log(up)
                    sendToUI("upd", up)
                }
                await timeout(1000)
            }
        }
        gotDeckCode = false
    }
}

async function getDb(){
    var data = await callDD('set1/en_us/data/set1-en_us.json')
    if(data !== false){
        let temp = data[0].assets[0].fullAbsolutePath
        let res = temp.replace("http://dd.b.pvp.net/", "")
        let version = res.split('/')[0]

        let exists = true
        try{
            let raw = fs.readFileSync(version+'.json')
            console.log(JSON.parse(raw))
        } catch (err) {
            exists = false
        }
        if(exists){
            return [true, version]
        } else {
            let core = await callDD('core/en_us/data/globals-en_us.json')
            if (core !== false ) {
                let nsets = core.sets.length
    
                let sets = []
                let failed = false
                for(let i = 1; i <= nsets; i++){
                    let set = await callDD('set'+i+'/en_us/data/set'+i+'-en_us.json')
                    if (set !== false) {
                        sets = sets.concat(set)
                    } else {
                        failed = true
                    }
                }
    
                if (!failed) {
                    let db = core
                    db.cards = sets
                    console.log(db)
                    fs.writeFileSync(version+'.json',JSON.stringify(db))
                    return [true, version]
                }
            }
        }
    } 
    return false

}



class Game {
    constructor(deck) {
        this.deck = deck
        this.mulligan = true
        this.currentCards = []
    }

    newRectangles(rect) {
        if (this.mulligan && rect.length > 6) {
            this.mulligan = false
        } else if (!this.mulligan) {
            let dif = this.calculateDif(rect)
            this.currentCards = rect
            return dif
        }
    }

    calculateDif(rect){
        let changes = []
        for(let i = 0; i<rect.length; i++){
            if (rect[i].LocalPlayer && !this.existsId(rect[i].CardID)) {
                changes.push({code: rect[i].CardCode, qtu: -1})
            }
        }
        return changes
    }

    existsId(id){
        for(let i = 0; i<this.currentCards.length; i++){
            if (this.currentCards[i].CardID === id) {
                return true
            }
        }
        return false
    }
}

polling()