'use strict';

angular.module('login', ['peerhandler'])

.controller('LoginCtrl', function($scope, $state, peerFactory) {

        $scope.login = function(user) {
            peerFactory.connectToPeerJS(user.phone);
            // Should probably  do some back-end log in related stuff in here?
            $state.go('tabs.home')
        };
});