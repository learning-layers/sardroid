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

        // Hack so we're disconnected for sure!
        peerFactory.disconnectFromPeerJS();

        if ($localStorage.user) {
            $scope.user = $localStorage.user;
        }

        $scope.goToSignUp = function () {
            $state.go('verify');
        }

        $scope.login = function(user) {
            console.log(user);
            if (typeof user !== 'undefined' && user.phoneNumber && user.password) {
                var number = user.phoneNumber.replace(/[ +]/g, '');
                apiFactory.auth.login(number, user.password)
                    .then(function success(results) {
                        console.log(results);
                        $localStorage.user  = results.user;
                        $localStorage.token = results.user.token;

                        peerFactory.connectToPeerJS(number).then(function() {
                            return socketFactory.connectToServer($localStorage.token);
                        }).then(function () {
                            $state.go('tabs.contacts');
                        })
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

