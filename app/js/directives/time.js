angular.module("timeTrackerApp").directive('time', function() {
  return {
    scope: {
      hours: '='
      minutes: '='
      seconds: '='
      taskId: '='
    },
    controller: mainController,
    template: '{{ hours[taskId] }} h : {{ minutes[taskId] }} m : {{ seconds[taskId] }} s'
  };
});
