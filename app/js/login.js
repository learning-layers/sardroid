'use strict';

angular.module('login', [])

.controller('LoginCtrl', function($scope, $state) {

        $scope.hideMenu = true;
        $scope.login = function(user) {
            // Should probably  do some back-end log in related stuff in here?
            $state.go('tabs.home')
        };
});