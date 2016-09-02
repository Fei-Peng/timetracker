const {app, BrowserWindow, ipcMain} = require('electron');
const dbFuncs = require('./lib/db.js');

// check if db exists, if not show welcome window
var fs = require("fs");
var path = require('path');
var dataPath = app.getPath("userData");
var file = path.join(dataPath, "db.sql");

var db;
var showWelcomeWindow = false;
fs.access(file, fs.F_OK, startDb);

function startDb(err) {
  if (!err) {
    console.log("DB file ok. Proceed");
  } else {
    // no file or not accessible
    console.log("No DB file or not accessible! Show welcome screen");
    showWelcomeWindow = true;
  }
  db = new dbFuncs.Db(file);
  global.db = db;

  // initialize db if necessary. Wait for tables to be created before running prepare statements
  if (showWelcomeWindow) {
    console.log("Initialize empty db..");
    // initialize db
    db.dbConnect.serialize(function() {
      this.run("CREATE TABLE IF NOT EXISTS `projects` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `name` varchar(255) not null, `description` varchar(255), `finished` integer, `tracking` integer, `created_at` datetime, `updated_at` datetime)", dbFuncs.printError);
      this.run("CREATE TABLE IF NOT EXISTS `times` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `project_id` varchar(255) not null, `start_time` datetime, `end_time` datetime, FOREIGN KEY(project_id) REFERENCES projects(id))", dbFuncs.printError);
    });
  }
  console.log("Run prepare statements..");
  db.prepareStatements();
}

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
  welcomeWindow = new BrowserWindow({width: 550, height: 661, parent: win});

  // and load the index.html of the app.
  welcomeWindow.loadURL(`file://${__dirname}/views/welcome.html`);
  // welcomeWindow.focus();

  // Emitted when the window is closed.
  welcomeWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    welcomeWindow = null;
  })
}

// event handler
let autostopWindow;
ipcMain.on("AUTOSTOP", function(event, arg) {
  console.log("Show auto stop window");
  // open confirmation window
  createAutostopWindow();
  // ipcMain.sendSync("AUTOSTOPWIN");
  // event.sender.send("AUTOSTOPWIN");
});

ipcMain.on("CloseAutoStopWin", function(event, arg) {
  autostopWindow.close();
});

function createAutostopWindow () {
  // Create the browser window.
  autostopWindow = new BrowserWindow({width: 500, height: 180, parent: win});    // parent makes it go on top

  // and load the index.html of the app.
  autostopWindow.loadURL(`file://${__dirname}/views/autostop.html`);
  // autostopWindow.focus();

  // Emitted when the window is closed.
  autostopWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    autostopWindow = null;
  })
}

// from autostop window to backend to main window
ipcMain.on("AutoStopped", function(event, arg) {
  win.webContents.send("AutoStopped");
});

ipcMain.on("AutoStoppedAddTime", function(event, mins) {
  win.webContents.send("AutoStoppedAddTime", mins);
});