'use strict';

angular.module('logincontroller', [])

.controller('LoginCtrl', function($scope) {
        $scope.login = function(user) {
            console.log(user);
            console.log($scope)
        };
});