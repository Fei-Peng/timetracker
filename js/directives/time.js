angular.module("timeTrackerApp").directive('timeCounter', function() {
  return {
    // scope: {
    //   hours: '='
    //   minutes: '='
    //   seconds: '='
    //   taskId: '='
    // },
    scope: false,
    controller: 'mainController',
    template: '<span>{{ hours[task.id] }} h : {{ minutes[task.id] }} m : {{ seconds[task.id] }} s</span>',
  };
});
