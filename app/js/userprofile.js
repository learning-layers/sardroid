'use strict';

angular.module('userprofile', [])

.controller('UserProfileCtrl', function($scope, $stateParams) {
           $scope.user = $stateParams.user;
});