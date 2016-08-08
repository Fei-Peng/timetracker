
'use strict';

// db
// var fs = require("fs");
var file = "./app/timetracker.sql";
var sqlite3 = require("sqlite3").verbose();

angular.module('timeTrackerApp').service('dbService', ["$rootScope", function($rootScope) {

  var db = new sqlite3.Database(file);

  // create tables if not done already
  db.serialize(function() {
    db.run("CREATE TABLE IF NOT EXISTS `projects` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `name` varchar(255) not null, `description` varchar(255), `finished` integer, `counting` integer, `created_at` datetime, `updated_at` datetime)", function(err) {
      if (err !== null) {console.log("Error: " + err);}
      // else {console.log("Table projects created.");}
    })

    db.run("CREATE TABLE IF NOT EXISTS `times` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `project_id` varchar(255) not null, `start_time` datetime, `end_time` datetime, FOREIGN KEY(project_id) REFERENCES projects(id))", function(err) {
      if (err !== null) {console.log("Error: " + err);}
      // else {console.log("Table times created.");}
    })
  })

  return db;
}]);
