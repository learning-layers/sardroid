'use strict';

angular.module('login', ['peerhandler'])

.controller('LoginCtrl', function($scope, $state, peerFactory) {
        if (peerFactory.isConnected()) {
            peerFactory.disconnectFromPeerJS();
        }

        $scope.login = function(user) {
            if (typeof user !== 'undefined' && user.phone) {
                peerFactory.connectToPeerJS(user.phone);
                // Should probably  do some back-end log in related stuff in here?
                $state.go('tabs.home');
            }
        };
});