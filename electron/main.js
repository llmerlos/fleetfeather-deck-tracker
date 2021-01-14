const { app, BrowserWindow, ipcMain } = require('electron')
const path = require("path");
const isDev = require("electron-is-dev");
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync');

var db = null

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
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: false,
            nodeIntegration: true
        }});
    mainWindow.loadURL(isDev? "http://localhost:3000": `file://${path.join(__dirname, "../index.html")}`);
    if(isDev){
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.removeMenu()
    }
    

}

app.on("ready", () => {
    createWindow()

    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    })

    mainWindow.on("closed", () => (
        app.quit()
    ));

    apiCallsWindow = new BrowserWindow({
        show: false,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true
        }
    })
    
    apiCallsWindow.loadURL(isDev? `file://${path.join(__dirname, "apicalls.html")}`: `file://${path.join(__dirname, "../electron/apicalls.html")}`);
    apiCallsWindow.webContents.openDevTools()

    apiCallsWindow.once('ready-to-show', () => {
        if(isDev){
            apiCallsWindow.show()
        }
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

ipcMain.on("infoFromApi", async (event, arg) => {
    console.log("Sending this "+arg.command)
    console.log(arg.payload)
    
    if (arg.command === "db") {
        let adapter = new FileSync(arg.payload+'.json')
        db = low(adapter)
        mainWindow.show()

    } else if (arg.command === "deck") {
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