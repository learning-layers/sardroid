'use strict';

angular.module('logincontroller', [])

.controller('LoginCtrl', function($scope, $state) {
        $scope.login = function(user) {
            // Should probably  do some back-end log in related stuff in here?
            $state.go('tabs.home')
        };
});