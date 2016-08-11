
angular.module("timeTrackerApp").controller("mainController", ["$rootScope", "$scope", "$window", '$interval', 'electronSvc', function ($rootScope, $scope, $window, $interval, electronSvc) {
  // const PAGE_SETTINGS = 'settings';
  // const PAGE_WELCOME = 'welcome';

  $scope.page = 'home';
  $scope.tasks = [];
  $scope.completedTasks = [];
  electronSvc.db.getTasks(getActiveTasksCallback);
  electronSvc.db.getCompletedTasks(getCompletedTasksCallback);

  $scope.totalTime = {}
  $scope.newTask = {};
  // var taskMap = {};

  // timer
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

  function stopTimer(id) {
    console.log('Timer stop');
    $scope.timerRunning[id] = false;
    if (id in intervals) {
      $interval.cancel(intervals[id]);
      intervals[id] = undefined;
    }
  };

  function restartTimer(id) {
    console.log('Timer restart');
    $scope.timer[id] = 0;
    resumeTimer(id);
  };

  function resumeTimer(id) {
    console.log('Timer resumed');
    computeTime(id);
    $scope.timerRunning[id] = true;
    intervals[id] = $interval(function() {tick(id)}, 1000);
  };

  function tick(id) {
    if ($scope.timerRunning[id]) {
      $scope.timer[id]++;
      computeTime(id);
      console.log('tick');
    }
  };

  // $scope.$on('tick', function(args) {
  //   if ($scope.timerRunning[args[0]]) { tick(args[0]); }
  // })

  // $scope.$watch('$scope.counter[id]', function(newValue, oldValue) {
  //   if (newValue !== oldValue && timerRunning) {
  //     $scope.startTimer(id);
  //   }
  // });


  // $rootScope.$on('ready', function() {
  //     var data = config.getServer()
  //     if (data){
  //         console.log("Connect", data);
  //         connectToServer(data.ip, data.port, data.user, data.password)
  //     } else {
  //         // First time starting application
  //         pageWelcome();
  //     }
  // });
  //
  // // Listen for incomming magnet links from the main process
  // electron.ipc.on('magnet', function(event, data){
  //     data.forEach(function(magnet){
  //         $utorrentService.addTorrentUrl(magnet);
  //     })
  // })

  function computeTotalTaskTime() {
    electronSvc.db.getTaskTime(getTaskTimeCallback)
  }

  function updateTrackingMap() {
    for (var i = 0; i < $scope.tasks.length; i++) {
      // taskMap[$scope.tasks[i].id] = $scope.tasks[i];
      var id = $scope.tasks[i].id
      if ($scope.tasks[i].tracking == 1) {
        $scope.timer[id] = Math.floor((Date.now() - $scope.tasks[i].updated_at) / 1000);
        $scope.timerRunning[id] = true;
        if (!id in intervals) {
          resumeTimer(id);
        }
      } else {
        $scope.timer[id] = 0;
        $scope.timerRunning[id] = false;
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
          $scope.totalTime[rows[i].project_id] = Math.floor(rows[i].totalTime / 3600000)   // returns milliseconds
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
        $scope.tasks.length = 0;
        for (var i = 0; i < rows.length; i++) {
          $scope.tasks.push(rows[i]);
        }
        updateTrackingMap();
      });
    }
  };

  function getCompletedTasksCallback(err, rows) {
    if (err !== null) {
      console.log(err);
    } else {
      console.log("Total completed tasks: " + rows.length);
      console.log(rows);
      $scope.$apply(function() {
        $scope.completedTasks.length = 0;
        for (var i = 0; i < rows.length; i++) {
          $scope.completedTasks.push(rows[i]);
        }
        computeTotalTaskTime();
      });
    }
  };

  function submitNewTaskCallback(err) {
    if (err !== null) {
      console.log("New task creation error: " + err);
    } else {
      console.log("New task " + $scope.newTask.name + " created.");
      $window.alert("New task " + $scope.newTask.name + " created.");
      electronSvc.db.getTasks(getActiveTasksCallback);
      $scope.gotoPage('home');
    }
  };

  function startStopCallback(err, rows) {
    if (err !== null) {
      console.log("Start/stop/archive tracking error: " + err);
    } else {
      // update with new
      console.log("Success. Update with new tasks.");
      electronSvc.db.getTasks(getActiveTasksCallback);
    }
  };

  function archiveActivateCallback(err, rows) {
    if (err !== null) {
      console.log("Archive/activate error: " + err);
    } else {
      // update with new
      console.log("Success. Update with new tasks.");
      electronSvc.db.getTasks(getActiveTasksCallback);
      electronSvc.db.getCompletedTasks(getCompletedTasksCallback);
    }
  };

  $scope.startTracking = function(task) {
    console.log("Start project tracking clicked: " + task.id);
    if (task.tracking == 1) {
      $window.alert("Project " + task.name + " is tracking already!");
    } else {
      electronSvc.db.startTracking(task.id, startStopCallback);
      restartTimer(task.id);
    }
  }

  $scope.stopTracking = function(task) {
    console.log("Stop project tracking clicked: " + task.id);
    if (task.tracking == 0) {
      $window.alert("Project is not tracking!");
    } else {
      electronSvc.db.stopTracking(task.id, task.updated_at, startStopCallback);
      stopTimer(task.id);
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
    // $window.alert("Project " + task.id + " archived.");
  };

  $scope.activateTask = function(task) {
    console.log("Activate project clicked: " + task.id);
    if ($window.confirm("Activate project " + task.name + " now?")) {
      electronSvc.db.activateTask(task.id, archiveActivateCallback);
    }
  }

  $scope.submitNewTask = function(newTask) {
    // statement is prepared already
    $scope.newTask = angular.copy(newTask);
    var args = [$scope.newTask.name, $scope.newTask.description, 0, 0, Date.now(), Date.now()];
    console.log("New task arguments: " + args);
    electronSvc.db.submitNewTask(args, submitNewTaskCallback);
  };

  $scope.gotoPage = function(page) {
      $scope.page = page;
  };

}]);
