
'use strict';

function printError(err) {
  if (err !== null) {console.log(err);}
}

// db
// var fs = require("fs");
var file = "./timetracker.sql";
var sqlite3 = require("sqlite3").verbose();

var db = new sqlite3.Database(file, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, printError);

// create tables if not done already
db.serialize(function() {
  db.run("CREATE TABLE IF NOT EXISTS `projects` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `name` varchar(255) not null, `description` varchar(255), `finished` integer, `tracking` integer, `created_at` datetime, `updated_at` datetime)", printError);

  db.run("CREATE TABLE IF NOT EXISTS `times` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `project_id` varchar(255) not null, `start_time` datetime, `end_time` datetime, FOREIGN KEY(project_id) REFERENCES projects(id))", printError);
});

// prepare statements
var insertTaskStmt = db.prepare("INSERT INTO projects (name, description, finished, tracking, created_at, updated_at) VALUES (?,?,?,?,?,?);", printError);
var insertTimeStmt = db.prepare("INSERT INTO times (project_id, start_time, end_time) VALUES (?,?,?);", printError);
// var queryTrackingStmt = db.prepare("SELECT tracking, updated_at FROM projects WHERE id = ?", printError);
var getTask = db.prepare("SELECT * from projects WHERE id = ?;", printError);
var startStopTrackingStmt = db.prepare("UPDATE projects SET tracking = ?, updated_at = ? WHERE id = ?;", printError);
var archiveStmt = db.prepare("UPDATE projects SET finished = 1, tracking = 0, updated_at = ? WHERE id = ?;", printError);
var activateStmt = db.prepare("UPDATE projects SET finished = 0, tracking = 0, updated_at = ? WHERE id = ?;", printError);
var taskTimeStmt = db.prepare("SELECT project_id, sum(end_time)-sum(start_time) as totalTime FROM times GROUP BY project_id;", printError);

exports.getTasks = function(callback) {
  db.all("SELECT * FROM projects WHERE finished = 0", callback);
};

exports.getCompletedTasks = function(callback) {
  db.all("SELECT * FROM projects WHERE finished = 1", callback);
};

exports.getTaskTime = function(callback) {
  taskTimeStmt.all(callback);
};

exports.submitNewTask = function(args, callback) {
  insertTaskStmt.run(args, callback);
};

exports.startTracking = function(id, callback) {
  startStopTrackingStmt.run([1, Date.now(), id], callback);
};

exports.stopTracking = function(id, updated_at, callback) {
  insertTimeStmt.run([id, updated_at, Date.now()], printError);
  startStopTrackingStmt.run([0, Date.now(), id], callback);
};

exports.archiveTask = function(id, tracking, updated_at, callback) {
  if (tracking == 1) {    // record time if already tracking
    insertTimeStmt.run([id, updated_at, Date.now()], printError);
  }
  archiveStmt.run([Date.now(), id], callback);
};

exports.activateTask = function(id, callback) {
  activateStmt.run([Date.now(), id], callback);
};
