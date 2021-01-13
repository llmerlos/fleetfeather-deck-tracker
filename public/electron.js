const { app, BrowserWindow, ipcMain } = require('electron')
const path = require("path");
const isDev = require("electron-is-dev");
const { DeckEncoder } = require('runeterra')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('assets/1_16_0.json')
const db = low(adapter)

let mainWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({ 
        width: 900, 
        height: 680,
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
        console.log(data);
    });
    
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('INITIALIZE_COUNTER', 0)
    });
    
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on("data", (evt, data) => {
    console.log(evt)
    console.log(data)
})

ipcMain.on("NEW_DECK", (evt, data) => {
    console.log("receiving")
    let deck = DeckEncoder.decode('CEAAECABAQJRWHBIFU2DOOYIAEBAMCIMCINCILJZAICACBANE4VCYBABAILR2HRL')//CECAMAIEAENSIJRUHIAQEAYJAIBQIBIRAMAQGFBOG4BACAYDBUAQCAZTAA
    let ndeck = []
    for (let i = 0; i < deck.length; i++){
        let res = db.get('cards').find({ cardCode: deck[i].code }).value()
        console.log(res)
        ndeck.push({
            code: deck[i].code, 
            info: res,
            qtt: deck[i].count,
            qtr: deck[i].count})
    }
    mainWindow.webContents.send("INITIALIZE_DECK", ndeck)
})