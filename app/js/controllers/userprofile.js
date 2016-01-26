'use strict';

/*
 * Module that contains a controller in charge of
 * viewing a user's profile
 */

angular.module('userprofile', [])

.controller('UserProfileCtrl', function($scope, $localStorage, $stateParams) {
        if ($stateParams.user) {
           $scope.user  = $stateParams.user;
        } else {
            $scope.user = $localStorage.user;
        }
        console.log($scope.user);
});

