'use strict';

angular.module('logincontroller', [])

.controller('LoginCtrl', function($scope, $state) {
        $scope.login = function(user) {
            // Should probably log in here?
            $state.go('home')
        };
});