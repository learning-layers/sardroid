'use strict';

/*
 * Pretty simple controller for the login screen.
 * Not much else to say about this one!
 */

angular.module('login', ['peerhandler'])

.controller('LoginCtrl', function($scope, $state, $localStorage, $ionicHistory, apiFactory, peerFactory, socketFactory, configFactory) {
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
            if (typeof user !== 'undefined' && user.phoneNumber && user.password) {
                apiFactory.auth.login(user.phoneNumber, user.password)
                    .then(function success(results) {
                        console.log(results);
                        $localStorage.user  = results.user;
                        $localStorage.token = results.user.token;
     
                        peerFactory.connectToPeerJS(user.phoneNumber.substring(1)).then(function() {
                            return socketFactory.connectToServer($localStorage.token);
                        }).then(function () {
                            $state.go('tabs.contacts');
                        })

                    })
                    .catch(function (error) {
                        console.log(error);
                    });
            }
        };
});

