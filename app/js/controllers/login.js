'use strict';

/*
 * Pretty simple controller for the login screen.
 * Not much else to say about this one!
 */

angular.module('login', ['peerhandler'])

.controller('LoginCtrl', function($scope, $state, $localStorage, $ionicHistory, peerFactory, socketFactory) {
        // Disable back button so we can't back to login!
        $ionicHistory.nextViewOptions({
            disableBack: true
        });

        // Hack so we're disconnected for sure!
        peerFactory.disconnectFromPeerJS();

        if ($localStorage.user) {
            $scope.user = $localStorage.user;
        }

        $scope.goToSignUp = function () {
            $state.go('verify');
        }

        $scope.login = function(user) {
            if (typeof user !== 'undefined' && user.phoneNumber) {
                // Should probably do some back-end log in related stuff in here?
                $localStorage.user = user;
                peerFactory.connectToPeerJS(user.phoneNumber).then(function() {
                    $state.go('tabs.contacts');
                    socketFactory.connectToServer();
                });
            }
        };
});

