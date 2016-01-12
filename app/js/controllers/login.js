'use strict';

/*
 * Pretty simple controller for the login screen.
 * Not much else to say about this one!
 */

angular.module('login', ['peerhandler'])

.controller('LoginCtrl', function($scope, $state, $localStorage, $ionicHistory, $translate, apiFactory, modalFactory,  peerFactory, socketFactory, configFactory) {
        // Disable back button so we can't back to login!
        $ionicHistory.nextViewOptions({
            disableBack: true
        });

        var loginCompleted = function (number) {
            peerFactory.connectToPeerJS(number).then(function() {
                apiFactory.setApiToken($localStorage.token);
                return socketFactory.connectToServer($localStorage.token);
            }).then(function () {
                $state.go('tabs.contacts');
            })
        }
        // Hack so we're disconnected for sure!
        peerFactory.disconnectFromPeerJS();

        // Already got a valid token, we can just log in
        if ($localStorage.user.phoneNumber && $localStorage.token) {
            loginCompleted($localStorage.user.phoneNumber);
        } else if ($localStorage.user) {
            $scope.user = $localStorage.user;
        }

        $scope.goToSignUp = function () {
            $state.go('verify');
        }

        $scope.login = function(user) {
            if (typeof user !== 'undefined' && user.phoneNumber && user.password) {

                var number = user.phoneNumber.replace(/[ +]/g, '');
 
                apiFactory.auth.login(number, user.password)
                    .then(function success(results) {
                        $localStorage.user  = results.user;
                        $localStorage.token = results.user.token;
                        loginCompleted();
                    })
                    .catch(function (error) {

                        console.log(error);
                        var name = error.name;

                        if (name.toLowerCase() === apiFactory.errorTypes.GENERIC.UNSPECIFIED_ERROR) {
                            name = 'TIMEOUT_ERROR';
                        }

                        modalFactory.alert($translate.instant('ERROR'), $translate.instant(name));
                    });
            }
        };
});

