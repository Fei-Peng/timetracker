const {app, BrowserWindow, ipcMain} = require('electron')
// const ipcMain = require('./app/js/eventHandler')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({width: 800, height: 600})

  // and load the index.html of the app.
  win.loadURL(`file://${__dirname}/app/index.html`)

  // Open the DevTools.
  win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

////////////////////////////////////////////////////////////////////////
// event handler handles all events through ipc channels
let newTaskWindow

function createNewTaskWindow(event, arg) {
  if(newTaskWindow == null) {
    newTaskWindow = new BrowserWindow({
      width: 640,
      height: 480,
      // show: false
    })

    newTaskWindow.loadURL(`file://${__dirname}/app/newTask.html`)
    newTaskWindow.show()

    newTaskWindow.on('closed',function() {
      newTaskWindow = null;
    })
  }
  // if windows created already, show it
  else {
    newTaskWindow.focus();
  }
}

ipcMain.on('new-task-window', function(event, arg) {
  createNewTaskWindow(event, arg);
})


ipcMain.on('focus-main', function(event, arg) {
  if (win === null) {
    createWindow();
  } else {
    win.focus();
  }
})
