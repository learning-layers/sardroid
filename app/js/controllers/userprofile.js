'use strict';

/*
 * Module that contains a controller in charge of
 * viewing a user's profile. TBD
 */

angular.module('userprofile', [])

.controller('UserProfileCtrl', function($scope, $stateParams) {
           $scope.user = $stateParams.user;
});

