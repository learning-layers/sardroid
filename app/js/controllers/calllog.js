'use strict';

/*
 *
 */

angular.module('callLog', [])
.controller('CallLogCtrl', function (callLogFactory, $scope) {
    callLogFactory.fetchLogsFromServer()
    .then(function (calls) {
        $scope.$apply(function () {
            console.log(calls);
            $scope.calls = calls;
        });
    })
    .catch(function (err) {
        console.log(err);
    });
});

