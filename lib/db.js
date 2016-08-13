
'use strict';

function printError(err) {
  if (err !== null) {console.log(err);}
}

var sqlite3 = require("sqlite3").verbose();

function prepareStatements() {
  this.insertTaskStmt = this.dbConnect.prepare("INSERT INTO projects (name, description, finished, tracking, created_at, updated_at) VALUES (?,?,?,?,?,?);", printError);
  this.insertTimeStmt = this.dbConnect.prepare("INSERT INTO times (project_id, start_time, end_time) VALUES (?,?,?);", printError);
  // var queryTrackingStmt = this.dbConnect.prepare("SELECT tracking, updated_at FROM projects WHERE id = ?", printError);
  this.getTasksStmt = this.dbConnect.prepare("SELECT * from projects WHERE finished = ?;", printError);
  this.startStopTrackingStmt = this.dbConnect.prepare("UPDATE projects SET tracking = ?, updated_at = ? WHERE id = ?;", printError);
  this.archiveStmt = this.dbConnect.prepare("UPDATE projects SET finished = 1, tracking = 0, updated_at = ? WHERE id = ?;", printError);
  this.activateStmt = this.dbConnect.prepare("UPDATE projects SET finished = 0, tracking = 0, updated_at = ? WHERE id = ?;", printError);
  this.taskTimeStmt = this.dbConnect.prepare("SELECT project_id, sum(end_time)-sum(start_time) as totalTime FROM times GROUP BY project_id;", printError);
  this.allTimesStmt = this.dbConnect.prepare("SELECT projects.name, start_time, end_time FROM projects, times WHERE projects.id = project_id AND projects.finished = 0;", printError);
}

// db
function Db(file) {
  this.dbConnect = new sqlite3.Database(file, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, printError);

  // prepare statements
  this.insertTaskStmt = null;
  this.insertTimeStmt = null;
  // var queryTrackingStmt = this.dbConnect.prepare("SELECT tracking, updated_at FROM projects WHERE id = ?", printError);
  this.getTasksStmt = null;
  this.startStopTrackingStmt = null;
  this.archiveStmt = null;
  this.activateStmt = null;
  this.taskTimeStmt = null;
  this.allTimesStmt = null;

  this.prepareStatements = prepareStatements;
}

exports.Db = Db;
exports.printError = printError;


