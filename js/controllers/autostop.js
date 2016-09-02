
angular.module("timeTrackerApp").controller("autostopController", ["$rootScope", "$scope", '$interval', '$timeout', 'electronSvc', function ($rootScope, $scope, $interval, $timeout, electronSvc) {

  var countDownInterval = undefined;
  $scope.countDown = 60;
  
  function startCountDown() {
    console.log("Start countdown");
    $timeout(function() {
      $scope.countDown = 60;
    }, 0);
    countDownInterval = $interval(function() {
      if ($scope.countDown > 0) {
        // $timeout(function() {
        $scope.countDown--;
        // });
        // console.log('tick');
      } else {
        $interval.cancel(countDownInterval);
        countDownInterval = undefined;
        $scope.autoStop();
      }
    }, 1000);
  }
  startCountDown();

  //////////////////////////// page elements ////////////////////////////
  $scope.autoStop = function() {
    console.log("Auto stop confirmed, stop all running jobs. (autostop.js)");
    if (countDownInterval) {
      $interval.cancel(countDownInterval);
      countDownInterval = undefined;
    }
    electronSvc.ipcRenderer.send("AutoStopped");
    electronSvc.ipcRenderer.send("CloseAutoStopWin");
  }

  $scope.autoStopAddTime = function() {
    console.log("Add 1 hr before autostop. (autostop.js)");
    $interval.cancel(countDownInterval);
    countDownInterval = undefined;
    electronSvc.ipcRenderer.send("AutoStoppedAddTime");
    electronSvc.ipcRenderer.send("CloseAutoStopWin");
  }
  
}]);