'use strict';

/*
 * Pretty simple controller for the login screen.
 * Not much else to say about this one!
 */

angular.module('login', [])

.controller('LoginCtrl', function($scope, $state, $localStorage, $ionicPlatform, $ionicHistory, $translate, apiFactory, modalFactory,  peerFactory, socketFactory, contactsFactory, configFactory) {

        $scope.isLoginButtonDisabled = false;

        var loginCompleted = function (number) {
            apiFactory.setApiToken($localStorage.token);
            $localStorage.hasBeenInRegister = true;

            var promises = [];

            promises.push(socketFactory.connectToServer($localStorage.token));
            promises.push(peerFactory.connectToPeerJS(number));

            if (!$localStorage.contactsBeenSynced) {
                promises.push(contactsFactory.syncContactsWithServer());
            }

            Promise.all(promises)
                .then(function (results) {
                    // Disable back button so we can't back to login!
                    $ionicHistory.nextViewOptions({
                        disableBack: true
                    });
                    $state.go('tabs.contacts');
                })
                .catch(function (error) {
                    $scope.isLoginButtonDisabled = false;
                    socketFactory.disconnectFromServer();
                    peerFactory.disconnectFromPeerJS();
                    console.log(error);
                })
        }

        // Hack so we're disconnected for sure!
        peerFactory.disconnectFromPeerJS();
        socketFactory.disconnectFromServer()

        // Already got a valid token, we can just initiate the log in process
        if ($localStorage.user && $localStorage.token) {
            $ionicPlatform.ready(function () {
                loginCompleted($localStorage.user.phoneNumber);
            });
        } else if ($localStorage.user) {
            $scope.user = $localStorage.user;
        }

        $scope.goToSignUp = function () {
            $localStorage.hasBeenInRegister = true;
            $state.go('verify', { state: 'register' });
        }

        $scope.goToResetPassword = function () {
            $state.go('verify', { state: 'reset_password' });
        }

        $scope.determineRegisterButtonClass = function () {
            return ($localStorage.hasBeenInRegister === true || typeof $localStorage.user !== 'undefined') ? null : 'notify-pulse' ;
        }

        $scope.login = function(user) {
            if (typeof user !== 'undefined' && user.phoneNumber && user.password) {
                $scope.isLoginButtonDisabled = true;

                var number = user.phoneNumber.replace(/[ +]/g, '');
                apiFactory.auth.login(number, user.password)
                    .then(function success(user) {
                        $localStorage.user  = user;
                        $localStorage.token = user.token;
                        loginCompleted(user.phoneNumber);
                    })
                    .catch(function (error) {
                        $scope.isLoginButtonDisabled = false;
                        var name = error.name;

                        if (name.toLowerCase() === apiFactory.errorTypes.GENERIC.UNSPECIFIED_ERROR) {
                            name = 'TIMEOUT_ERROR';
                        }

                        modalFactory.alert($translate.instant('ERROR'), $translate.instant(name));
                    })
            } else if (user && !user.phoneNumber) {
                modalFactory.alert($translate.instant('ERROR'), $translate.instant('MALFORMED_NUMBER'));

            } else if (user && !user.password) {
                modalFactory.alert($translate.instant('ERROR'), $translate.instant('PASSWORD_MISSING'));
            }
        };
});

