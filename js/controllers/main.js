
angular.module("timeTrackerApp").controller("mainController", ["$rootScope", "$scope", "$window", '$interval', 'electronSvc', function ($rootScope, $scope, $window, $interval, electronSvc) {
  // const PAGE_SETTINGS = 'settings';
  // const PAGE_WELCOME = 'welcome';

  $scope.page = 'home';
  $scope.tasks = [];
  $scope.completedTasks = [];
  electronSvc.db.getTasksStmt.all(0, getActiveTasksCallback);
  electronSvc.db.getTasksStmt.all(1, getCompletedTasksCallback);

  $scope.totalTime = {};
  $scope.totalSeconds = {};
  $scope.totalMinutes = {};
  $scope.totalHours = {};
  $scope.newTask = {};
  // var taskMap = {};

  /////////////// timer ///////////////
  $scope.timer = {};
  $scope.seconds = {};
  $scope.minutes = {};
  $scope.hours = {};
  $scope.timerRunning = {};
  var intervals = {};

  function computeTime(id) {
    $scope.seconds[id] = $scope.timer[id] % 60;
    $scope.minutes[id] = Math.floor(($scope.timer[id] / 60)) % 60;
    $scope.hours[id] = Math.floor($scope.timer[id] / 3600);
  }

  function computeTotalTime(id) {
    $scope.totalSeconds[id] = $scope.totalTime[id] % 60;
    $scope.totalMinutes[id] = Math.floor(($scope.totalTime[id] / 60)) % 60;
    $scope.totalHours[id] = Math.floor($scope.totalTime[id] / 3600);
  }

  function stopTimer(id) {
    console.log('Timer stop');
    $scope.timerRunning[id] = false;
    if (id in intervals) {
      $interval.cancel(intervals[id]);
      intervals[id] = undefined;
    }
    $scope.totalTime[id] += $scope.timer[id];
    computeTotalTime(id);
  }

  function restartTimer(id) {
    console.log('Timer restart');
    $scope.timer[id] = 0;
    resumeTimer(id);
  }

  function resumeTimer(id) {
    console.log('Timer resumed');
    computeTime(id);
    $scope.timerRunning[id] = true;
    intervals[id] = $interval(function() {tick(id)}, 1000);
  }

  function tick(id) {
    if ($scope.timerRunning[id]) {
      $scope.timer[id]++;
      computeTime(id);
      console.log('tick');
    }
  }

  ///////////////// summary page: counter for hours in different dates, chart ///////////////
  $scope.allDates = [];
  $scope.dateCounter = {};
  // for chart
  $scope.series = [];     // series label
  $scope.data = [];       // data
  $scope.chartOptions = {scales: {
                            xAxes: [{
                              stacked: true,
                              ticks: {
                                min: 0,
                                max: 24
                              },
                              scaleLabel: {
                                display: true,
                                labelString: 'Date'
                              }
                            }],
                            yAxes: [{
                              ticks: {
                                beginAtZero:true
                              },
                              scaleLabel: {
                                display: true,
                                labelString: 'Hours'
                              }
                            }]
                          },
                          // title: {
                          //     display: true,
                          //     text: 'Custom Chart Title'
                          // }
                        };

  function getDateCounters() {
    for (var i = 0; i < $scope.tasks.length; i++) {
      $scope.dateCounter[$scope.tasks[i].name] = {};
    }
    // for (var i = 0; i < $scope.completedTasks.length; i++) {
    //   $scope.dateCounter[$scope.completedTasks[i].name] = {};
    // }
    electronSvc.db.allTimesStmt.all(getAllTimesCallback);
  }

  // this now only gets active tasks
  function getAllTimesCallback(err, rows) {
    if (err !== null) {
      console.log(err);
    } else {
      console.log("All times: ");
      // console.log(rows);
      var dayInMilliseconds = 3600000 * 24;
      $scope.$apply(function() {
        for (var i = 0; i < rows.length; i++) {
          var s = new Date(rows[i].start_time);
          var e = new Date(rows[i].end_time);
          var dayS = s.getDate();           // getDate returns 1-31
          var dayE = e.getDate();
          var monthS = s.getMonth() + 1;    // getMonth returns 0-11
          var monthE = e.getMonth() + 1;
          var sString = monthS.toString() + "-" + dayS.toString();
          var eString = monthE.toString() + "-" + dayE.toString();
          if ($scope.allDates.indexOf(sString) == -1) {    // populate objects
            $scope.allDates.push(sString);
          }
          if (!('total' in $scope.dateCounter[rows[i].name])) {
            $scope.dateCounter[rows[i].name]['total'] = 0
          }
          if (!(sString in $scope.dateCounter[rows[i].name])) {
            $scope.dateCounter[rows[i].name][sString] = 0
          }
          // check if there are more than 0 day in between start and end
          // put things in in order
          var dateSPlusOne = null;
          var dateE = null;
          var dayDiff = null;
          if (dayS != dayE) {
            dateSPlusOne = new Date(s.getFullYear(), monthS-1, dayS+1);   // Date converts if e.g. day = 32
            dateE = new Date(e.getFullYear(), monthE-1, dayE);
            if (dateE > dateSPlusOne) {
              dayDiff = Math.round((dateE.getTime() - dateSPlusOne.getTime()) / dayInMilliseconds);
              for (var d = 0; d < dayDiff; d++) {
                var dd = new Date(dateSPlusOne.getTime() + d * dayInMilliseconds);
                var dString = dd.getMonth().toString() + "-" + dd.getDay().toString();
                if (!(dString in $scope.dateCounter[rows[i].name])) {
                  $scope.dateCounter[rows[i].name][dString] = 0
                }
                if ($scope.allDates.indexOf(dString) == -1) {
                  $scope.allDates.push(dString);
                }
              }
            }
          }
          if ($scope.allDates.indexOf(eString) == -1) {
            $scope.allDates.push(eString);
          }
          if (!(eString in $scope.dateCounter[rows[i].name])) {
            $scope.dateCounter[rows[i].name][eString] = 0
          }
          // add time
          if (dayS != dayE) {
            $scope.dateCounter[rows[i].name][sString] += dateSPlusOne.getTime() - rows[i].start_time;
            $scope.dateCounter[rows[i].name][eString] += rows[i].end_time - dateE.getTime();
            $scope.dateCounter[rows[i].name]['total'] += dateSPlusOne.getTime() - rows[i].start_time + rows[i].end_time - dateE.getTime();
            if (!dayDiff) {
              for (var d = 0; d < dayDiff; d++) {
                var dd = new Date(dateSPlusOne.getTime() + d * dayInMilliseconds);
                var dString = dd.getMonth().toString() + "-" + dd.getDay().toString();
                $scope.dateCounter[rows[i].name][dString] += dayInMilliseconds;
              }
            }
          } else {
            $scope.dateCounter[rows[i].name][sString] += rows[i].end_time - rows[i].start_time;
            $scope.dateCounter[rows[i].name]['total'] += rows[i].end_time - rows[i].start_time;
          }
        }
        // when all adds are done, go through and convert to hrs
        for (var name in $scope.dateCounter) {
          if ($scope.dateCounter.hasOwnProperty(name)) {
            for (var c in $scope.dateCounter[name]) {
              if ($scope.dateCounter[name].hasOwnProperty(c)) {
                $scope.dateCounter[name][c] = Math.round($scope.dateCounter[name][c]/360000) / 10;
              }
            }
          }
        }
        $scope.series = Object.keys($scope.dateCounter);
        $scope.data = [];
        for (var i = 0; i < $scope.series.length; i++) {
          dataSeries = [];
          for (var d = 0; d < $scope.allDates.length; d++) {
            if (!($scope.allDates[d] in $scope.dateCounter[$scope.series[i]])) {
              dataSeries.push(0);
            } else {
              dataSeries.push($scope.dateCounter[$scope.series[i]][$scope.allDates[d]]);
            }
          }
          $scope.data.push(dataSeries);
        }
      });
      // console.log($scope.allDates);
      // console.log($scope.dateCounter);
    }
  }

  function updateTrackingMap() {
    for (var i = 0; i < $scope.tasks.length; i++) {
      // taskMap[$scope.tasks[i].id] = $scope.tasks[i];
      var id = $scope.tasks[i].id;
      if ($scope.tasks[i].tracking == 1) {
        $scope.timer[id] = Math.floor((Date.now() - $scope.tasks[i].updated_at) / 1000);
        $scope.timerRunning[id] = true;
        if (!(id in intervals)) {
          resumeTimer(id);
        }
      } else {
        $scope.timer[id] = 0;
        $scope.timerRunning[id] = false;
        computeTime(id);
      }
      if (!(id in $scope.totalTime)) {
        $scope.totalTime[id] = 0;
        computeTotalTime(id);
      }
    }
    // console.log(taskMap);
  }

  function getTaskTimeCallback(err, rows) {
    if (err !== null) {
      console.log(err);
    } else {
      console.log("Task times: ");
      console.log(rows);
      $scope.$apply(function() {
        for (var i = 0; i < rows.length; i++) {
          $scope.totalTime[rows[i].project_id] = Math.floor(rows[i].totalTime / 1000);   // returns milliseconds
          computeTotalTime(rows[i].project_id);
        }
        for (var t = 0; t < $scope.completedTasks.length; t++) {
          var id = $scope.completedTasks[t].id
          if (!(id in $scope.totalTime)) {
            $scope.totalTime[id] = 0;
            computeTotalTime(id);
          }
        }
      });
    }
  }

  function getActiveTasksCallback(err, rows) {
    if (err !== null) {
      console.log(err);
    } else {
      console.log("Total tasks: " + rows.length);
      console.log(rows);
      $scope.$apply(function() {
        $scope.tasks = rows;
        // $scope.tasks.length = 0;
        // for (var i = 0; i < rows.length; i++) {
        //   $scope.tasks.push(rows[i]);
        // }
        updateTrackingMap();
      });
    }
  }

  function getCompletedTasksCallback(err, rows) {
    if (err !== null) {
      console.log(err);
    } else {
      console.log("Total completed tasks: " + rows.length);
      console.log(rows);
      $scope.$apply(function() {
        $scope.completedTasks = rows;
        // $scope.completedTasks.length = 0;
        // for (var i = 0; i < rows.length; i++) {
        //   $scope.completedTasks.push(rows[i]);
        // }
        electronSvc.db.taskTimeStmt.all(getTaskTimeCallback);
      });
    }
  }

  function submitNewTaskCallback(err) {
    if (err !== null) {
      console.log("New task creation error: " + err);
    } else {
      console.log("New task " + $scope.newTask.name + " created.");
      $window.alert("New task " + $scope.newTask.name + " created.");
      $scope.newTask = {}
      electronSvc.db.getTasksStmt.all(0, getActiveTasksCallback);
      $scope.gotoPage('home');
    }
  }

  function startStopCallback(err, rows) {
    if (err !== null) {
      console.log("Start/stop/archive tracking error: " + err);
    } else {
      // update with new
      console.log("Success. Update with new tasks.");
      electronSvc.db.getTasksStmt.all(0, getActiveTasksCallback);
    }
  }

  function archiveActivateCallback(err, rows) {
    if (err !== null) {
      console.log("Archive/activate error: " + err);
    } else {
      // update with new
      console.log("Success. Update with new tasks.");
      electronSvc.db.getTasksStmt.all(0, getActiveTasksCallback);
      electronSvc.db.getTasksStmt.all(1, getCompletedTasksCallback);
    }
  }

  function deleteTaskCallback(err) {
    if (err !== null) {
      console.log("Delete task error: " + err);
    } else {
      // update with new
      console.log("Success. Update archived tasks.");
      electronSvc.db.getTasksStmt.all(1, getCompletedTasksCallback);
    }
  }

  $scope.startTracking = function(task) {
    console.log("Start project tracking clicked: " + task.id);
    if (task.tracking == 1) {
      $window.alert("Project " + task.name + " is tracking already!");
    } else {
      restartTimer(task.id);
      electronSvc.db.startStopTrackingStmt.run([1, Date.now(), task.id], startStopCallback);
    }
  };

  function printErr(err) {
    if (err != null) {
      console.log(Err);
    }
  }

  $scope.stopTracking = function(task) {
    console.log("Stop project tracking clicked: " + task.id);
    if (task.tracking == 0) {
      $window.alert("Project is not tracking!");
    } else {
      stopTimer(task.id);
      electronSvc.db.insertTimeStmt.run([task.id, task.updated_at, Date.now()], printErr);
      electronSvc.db.startStopTrackingStmt.run([0, Date.now(), task.id], startStopCallback);
    }
  };

  $scope.archiveTask = function(task) {
    console.log("Archive project clicked: " + task.id);
    if (task.tracking == 1) {
      if ($window.confirm("Project " + task.name + " is tracking. Stop now and archive?")) {
        stopTimer(task.id);
        electronSvc.db.insertTimeStmt.run([task.id, task.updated_at, Date.now()], printErr);
        electronSvc.db.startStopTrackingStmt.run([0, Date.now(), task.id], startStopCallback);
        electronSvc.db.archiveStmt.run([Date.now(), task.id], archiveActivateCallback);
      }
    } else {
      if ($window.confirm("Archive project " + task.name + " now?")) {
        stopTimer(task.id);
        electronSvc.db.archiveStmt.run([Date.now(), task.id], archiveActivateCallback);
      }
    }
  };

  $scope.activateTask = function(task) {
    console.log("Activate project clicked: " + task.id);
    if ($window.confirm("Activate project " + task.name + " now?")) {
      electronSvc.db.activateStmt.run([Date.now(), task.id], archiveActivateCallback);
    }
  };

  $scope.deleteTask = function(task) {
    console.log("Delete project clicked: " + task.id);
    if ($window.confirm("Delete project " + task.name + " now? This is not reversable.")) {
      electronSvc.db.dbConnect.serialize(function() {
        electronSvc.db.deleteTaskStmt.run(task.id);
        electronSvc.db.deleteTimeStmt.run(task.id, deleteTaskCallback);
      });
    }
  }

  $scope.submitNewTask = function(newTask) {
    // statement is prepared already
    $scope.newTask = angular.copy(newTask);
    var args = [$scope.newTask.name, $scope.newTask.description, 0, 0, Date.now(), Date.now()];
    console.log("New task arguments: " + args);
    electronSvc.db.insertTaskStmt.run(args, submitNewTaskCallback);
  };

  $scope.gotoPage = function(page) {
    switch(page) {
      case 'home':
        $scope.homeClass = 'active';
        $scope.newTaskClass = '';
        $scope.summaryClass = '';
        break;
      case 'newTask':
        $scope.homeClass = '';
        $scope.newTaskClass = 'active';
        $scope.summaryClass = '';
        break;
      case 'summary':
        getDateCounters();
        $scope.homeClass = '';
        $scope.newTaskClass = '';
        $scope.summaryClass = 'active';
        break;
    }
    $scope.page = page;
  };

}]);
