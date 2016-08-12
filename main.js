const {app, BrowserWindow, ipcMain} = require('electron');

// check if db exists, if not show welcome window
var fs = require("fs");
var file = "./timetracker.sql";

var showWelcomeWindow = false;
fs.access(file, fs.F_OK, function(err) {
  if (!err) {
    console.log("DB file ok. Proceed");
  } else {
    // no file or not accessible
    console.log("No DB file or not accessible! Show welcome screen");
    showWelcomeWindow = true;
  }
});

const db = require('./lib/db.js');
global.db = db;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({width: 1000, height: 700});

  // and load the index.html of the app.
  win.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  // win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function() {
  createWindow();
  if (showWelcomeWindow) {
    createWelcomeWindow();
  }
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// welcome window
let welcomeWindow;
function createWelcomeWindow () {
  // Create the browser window.
  welcomeWindow = new BrowserWindow({width: 550, height: 661});

  // and load the index.html of the app.
  welcomeWindow.loadURL(`file://${__dirname}/views/welcome.html`);

  // Emitted when the window is closed.
  welcomeWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    welcomeWindow = null;
  })
}