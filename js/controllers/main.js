
angular.module("timeTrackerApp").controller("mainController", ["$rootScope", "$scope", "$window", '$interval', 'electronSvc', function ($rootScope, $scope, $window, $interval, electronSvc) {
  // const PAGE_SETTINGS = 'settings';
  // const PAGE_WELCOME = 'welcome';

  $scope.page = 'home';
  $scope.tasks = [];
  $scope.completedTasks = [];
  electronSvc.db.getTasks(getActiveTasksCallback);
  electronSvc.db.getCompletedTasks(getCompletedTasksCallback);

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
  $scope.series = [];     // for chart series label
  $scope.data = [];       // for chart data
  $scope.chartOptions = {scales: {
                            xAxes: [{
                              stacked: true,
                              ticks: {
                                min: 0,
                                max: 24
                              }
                            }],
                            yAxes: [{
                              ticks: {
                                beginAtZero:true
                              }
                            }],
                          }
                        };

  function getDateCounters() {
    for (var i = 0; i < $scope.tasks.length; i++) {
      $scope.dateCounter[$scope.tasks[i].name] = {};
    }
    // for (var i = 0; i < $scope.completedTasks.length; i++) {
    //   $scope.dateCounter[$scope.completedTasks[i].name] = {};
    // }
    electronSvc.db.getAllTimes(getAllTimesCallback);
  }

  // this now only gets active tasks
  function getAllTimesCallback(err, rows) {
    if (err !== null) {
      console.log(err);
    } else {
      console.log("All times: ");
      // console.log(rows);
      $scope.$apply(function() {
        for (var i = 0; i < rows.length; i++) {
          var s = new Date(rows[i].start_time);
          var e = new Date(rows[i].end_time);
          var dayS = s.getDate();
          var dayE = e.getDate();
          var monthS = s.getMonth() + 1;
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
            dateSPlusOne = new Date(s.getFullYear(), monthS-1, dayS+1);
            dateE = new Date(e.getFullYear(), monthS-1, dayE);
            if (dateE > dateSPlusOne) {
              dayDiff = Math.round((dateE.getTime() - dateSPlusOne.getTime()) / 3600000 / 24);
              for (var d = 0; d < dayDiff; d++) {
                var dd = new Date(dateSPlusOne.getTime() + d * 24 * 3600000);
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
                var dd = new Date(dateSPlusOne.getTime() + d * 24 * 3600000);
                var dString = dd.getMonth().toString() + "-" + dd.getDay().toString();
                if (!(dString in $scope.dateCounter[rows[i].name])) {
                  $scope.dateCounter[rows[i].name][dString] += 3600000 * 24;
                }
              }
            }
          } else {
            $scope.dateCounter[rows[i].name][sString] += rows[i].end_time - rows[i].start_time;
            $scope.dateCounter[rows[i].name]['total'] += rows[i].end_time - rows[i].start_time;
          }
        }
        // go through and convert to hrs
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

  function getTotalTaskTime() {
    electronSvc.db.getTaskTime(getTaskTimeCallback)
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
        getTotalTaskTime();
      });
    }
  }

  function submitNewTaskCallback(err) {
    if (err !== null) {
      console.log("New task creation error: " + err);
    } else {
      console.log("New task " + $scope.newTask.name + " created.");
      $window.alert("New task " + $scope.newTask.name + " created.");
      electronSvc.db.getTasks(getActiveTasksCallback);
      $scope.gotoPage('home');
    }
  }

  function startStopCallback(err, rows) {
    if (err !== null) {
      console.log("Start/stop/archive tracking error: " + err);
    } else {
      // update with new
      console.log("Success. Update with new tasks.");
      electronSvc.db.getTasks(getActiveTasksCallback);
    }
  }

  function archiveActivateCallback(err, rows) {
    if (err !== null) {
      console.log("Archive/activate error: " + err);
    } else {
      // update with new
      console.log("Success. Update with new tasks.");
      electronSvc.db.getTasks(getActiveTasksCallback);
      electronSvc.db.getCompletedTasks(getCompletedTasksCallback);
    }
  }

  $scope.startTracking = function(task) {
    console.log("Start project tracking clicked: " + task.id);
    if (task.tracking == 1) {
      $window.alert("Project " + task.name + " is tracking already!");
    } else {
      restartTimer(task.id);
      electronSvc.db.startTracking(task.id, startStopCallback);
    }
  };

  $scope.stopTracking = function(task) {
    console.log("Stop project tracking clicked: " + task.id);
    if (task.tracking == 0) {
      $window.alert("Project is not tracking!");
    } else {
      stopTimer(task.id);
      electronSvc.db.stopTracking(task.id, task.updated_at, startStopCallback);
    }
  };

  $scope.archiveTask = function(task) {
    console.log("Archive project clicked: " + task.id);
    if (task.tracking == 1) {
      if ($window.confirm("Project " + task.name + " is tracking. Stop now and archive?")) {
        stopTimer(task.id);
        electronSvc.db.archiveTask(task.id, 1, task.updated_at, archiveActivateCallback);
      }
    } else {
      if ($window.confirm("Archive project " + task.name + " now?")) {
        stopTimer(task.id);
        electronSvc.db.archiveTask(task.id, 0, task.updated_at, archiveActivateCallback);
      }
    }
  };

  $scope.activateTask = function(task) {
    console.log("Activate project clicked: " + task.id);
    if ($window.confirm("Activate project " + task.name + " now?")) {
      electronSvc.db.activateTask(task.id, archiveActivateCallback);
    }
  };

  $scope.submitNewTask = function(newTask) {
    // statement is prepared already
    $scope.newTask = angular.copy(newTask);
    var args = [$scope.newTask.name, $scope.newTask.description, 0, 0, Date.now(), Date.now()];
    console.log("New task arguments: " + args);
    electronSvc.db.submitNewTask(args, submitNewTaskCallback);
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
