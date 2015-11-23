'use strict';

angular.module('call', [])

.controller('CallCtrl', function($scope, $stateParams) {
        $scope.user = $stateParams.user;
});