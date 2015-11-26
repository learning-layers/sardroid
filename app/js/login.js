'use strict';

angular.module('login', ['peerhandler'])

.controller('LoginCtrl', function($scope, $state, $localStorage, peerFactory) {

        if ($localStorage.user) {
            $scope.user = $localStorage.user;
        }

        $scope.login = function(user) {
            if (typeof user !== 'undefined' && user.phone) {
                if (!peerFactory.isConnected()) {
                    $localStorage.user = user;
                    peerFactory.connectToPeerJS(user.phone);
                }
                // Should probably  do some back-end log in related stuff in here?
                $state.go('tabs.contacts');
            }
        };
});