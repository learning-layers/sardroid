'use strict';

angular.module('login', ['peerhandler'])

.controller('LoginCtrl', function($scope, $state, $localStorage, peerFactory) {

        if ($localStorage.user) {
            $scope.user = $localStorage.user;
        }

        $scope.login = function(user) {
            if (typeof user !== 'undefined' && user.phone) {

                if (peerFactory.isConnected() && peerFactory.getMe().id === user.phone) {
                    console.log('Changing connection name');
                    peerFactory.disconnectFromPeerJS();
                }

                if (!peerFactory.isConnected()) {
                    console.log('not connected! connecting');
                    $localStorage.user = user;
                    peerFactory.connectToPeerJS(user.phone).then(function() {
                        $state.go('tabs.contacts');
                    });
                }
                // Should probably  do some back-end log in related stuff in here?
            }
        };
});