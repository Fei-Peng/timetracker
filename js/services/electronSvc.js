angular.module('timeTrackerApp').factory("electronSvc", [function() {
    var o = {};

    // Get the Electron remote
    const remote        = require('electron').remote;

    // Directly accesible modules
    o.ipc               = require('electron').ipcRenderer;
    o.shell             = require('electron').shell;

    //Remote moudles from main process
    o.app               = remote.app;
    o.browserWindow     = remote.browserWindow;
    o.clipboard         = remote.clipboard;
    o.dialog            = remote.dialog;
    o.menu              = remote.Menu;
    o.menuItem          = remote.menuItem;
    o.nativeImage       = remote.nativeImage;
    o.powerMonitor      = remote.powerMonitor;
    o.protocol          = remote.protocol;
    o.screen            = remote.screen;
    o.tray              = remote.shell;
    o.capturer          = remote.capturer;
    o.autoUpdater       = remote.autoUpdater;

    // Custom resources
    o.db            = remote.getGlobal('db');

    // Return object
    return o;
}])
