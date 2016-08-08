// ipc
const {ipcRenderer} = require('electron')

// create new task clicked
const createNewTaskClick = function() {
  ipcRenderer.send('new-task-window');
};

// focus on main time tracking page
const focusMain = function() {
  ipcRenderer.send('focus-main');
};


// jquery
$(function() {

  // add event listeners
  $('#main').on("click", focusMain);
  $('#new_task').on("click", createNewTaskClick);



});

// angular
