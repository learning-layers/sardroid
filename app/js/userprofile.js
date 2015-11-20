'use strict';

angular.module('userprofile', [])

.controller('UserProfileCtrl', function($scope, $stateParams, $state) {
           $scope.user = $stateParams.user;
});