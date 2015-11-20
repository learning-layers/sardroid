'use strict';

angular.module('userprofile', [])

.controller('UserProfileCtrl', function($scope, $stateParams) {
        console.log($stateParams);
           $scope.user = $stateParams.user;
});