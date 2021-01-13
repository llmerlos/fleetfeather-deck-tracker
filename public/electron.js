const { app, BrowserWindow, ipcMain } = require('electron')
const path = require("path");
const isDev = require("electron-is-dev");
//const { DeckEncoder } = require('runeterra')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('assets/2_0_0.json')
const db = low(adapter)

let mainWindow = null;
let apiCallsWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({ 
        width: 300,
        height: 700,
        minWidth: 300,
        minHeight: 600,
        show: false,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true
        }});
    mainWindow.loadURL(isDev? "http://localhost:3000": `file://${path.join(__dirname, "../build/index.html")}`);
    mainWindow.on("closed", () => (mainWindow = null));
}

app.on("ready", () => {
    createWindow()
    //let res = db.get('cards').find({ cost: 8 }).value()

    ipcMain.on('COUNTER_UPDATED', (event, data) => {
        console.log(data)
    })

    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
    })

    apiCallsWindow = new BrowserWindow({
        show: false,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true
        }
    })
    
    apiCallsWindow.loadURL(isDev? `file://${path.join(__dirname, "../src/apicalls.html")}`: `file://${path.join(__dirname, "../build/apicalls.html")}`);
    apiCallsWindow.webContents.openDevTools()
    
    apiCallsWindow.once('ready-to-show', () => {
        apiCallsWindow.show()
    })
    
    apiCallsWindow.on('closed', () => {
        apiCallsWindow = null
    })
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit()
    }
})

app.on("activate", () => {
    if (mainWindow === null) {
        createWindow()
    }
});

app.on("data", (evt, data) => {
    console.log(evt)
    console.log(data)
})

ipcMain.on("infoFromApi", async (event, arg) => {
    console.log("Sending this "+arg.command)
    console.log(arg.payload)
    
    if (arg.command === "deck") {
        var deck = []
        for(var key in arg.payload){
            let res = db.get('cards').find({ cardCode: key }).value()
            let reg = db.get('regions').find({nameRef: res.regionRef}).value()
            res.assets[0].region = reg.iconAbsolutePath
            deck.push({
                code: key, 
                info: res,
                qtt: arg.payload[key],
                qtr: arg.payload[key]
            })
        }

        deck.sort((a,b) => (a.info.cost > b.info.cost) ? 1 : (a.info.cost === b.info.cost) ? ((a.info.name > b.info.name) ? 1 : -1) : -1)
        //console.log(deck)
        mainWindow.webContents.send("INITIALIZE_DECK", deck)
    } else if (arg.command === "upd"){
        mainWindow.webContents.send("UPDATE_DECK", arg.payload)
    }
  })