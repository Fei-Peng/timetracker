
angular.module("timeTrackerApp").controller("mainController", ["$rootScope", "$scope", 'dbService', function ($rootScope, $scope, dbService) {
  // const PAGE_SETTINGS = 'settings';
  // const PAGE_WELCOME = 'welcome';

  $scope.page = 'home';
  var tasks = getTasks();
  var newTask = {};

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

  function getTasks() {
    dbService.all("SELECT * FROM projects", function(err, rows) {
      return rows;
    });
  }

  function submitNewTask() {
    // should escape things but whatever
    var query = "INSERT INTO projects (name, description, finished, counting, created_at, updated_at), VALUES (" + newTask.name + "," + newTask.description + ", 0, 0," + Date.now() + "," + Date.now() + ")";
    dbService.serialize(function() {
      dbService.exec(query, function(err) {
        if (err !== null) {
          console.log("New task creation error: " + err);
        } else {
          console.log("New task " + newTask.name + "created.");
          tasks = getTasks();
        }
      })
    });
  }

  $scope.gotoPage = function(page) {
      $scope.page = page;
  }

}]);
