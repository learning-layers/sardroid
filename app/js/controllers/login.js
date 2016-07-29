'use strict';

/*
 * Pretty simple controller for the login screen.
 * Not much else to say about this one!
 */

angular.module('login', [])
.controller('LoginCtrl', function ($scope, $state, $localStorage,
                                   $ionicPlatform, $ionicHistory, $translate,
                                   apiFactory, modalFactory, trackingFactory,
                                   peerFactory, socketFactory, contactsFactory,
                                   notificationFactory, callLogFactory) {
    var loginCompleted = function (number) {
        apiFactory.setApiToken($localStorage.token);

        apiFactory.user.generatePeerId()
        .then(function (data) {
            var id = data.peerJSId;
            var promises = [];

            $localStorage.hasBeenInRegister = true;

            promises.push(socketFactory.connectToServer($localStorage.token));
            promises.push(peerFactory.connectToPeerJS(id));
            promises.push(callLogFactory.fetchNotSeenCalls());

            if (!$localStorage.contactsBeenSynced) {
                promises.push(contactsFactory.syncContactsWithServer());
            }

            return Promise.all(promises);
        })
        .then(function () {
            // Disable back button so we can't back to login!
            $ionicHistory.nextViewOptions({
                disableBack: true
            });

            notificationFactory.register();
            trackingFactory.track.auth.login();
            $state.go('tabs.contacts');
        })
        .catch(function () {
            delete $localStorage.token;
            delete $localStorage.user.token;
            apiFactory.deleteApiToken();

            $scope.$apply(function () {
                $scope.isLoginButtonDisabled = false;
            });

            socketFactory.disconnectFromServer();
            peerFactory.disconnectFromPeerJS();
        });
    };

    // Hack so we're disconnected for sure!
    peerFactory.disconnectFromPeerJS();
    socketFactory.disconnectFromServer();

    // Already got a valid token, we can just initiate the log in process
    if ($localStorage.user && $localStorage.token) {
        // Wait until Ionic is fully loaded before moving on
        $ionicPlatform.ready(function () {
            loginCompleted($localStorage.user.phoneNumber);
        });
    } else if ($localStorage.user) {
        $scope.user = $localStorage.user;
    }

    $scope.isLoginButtonDisabled = false;

    $scope.goToSignUp = function () {
        $localStorage.hasBeenInRegister = true;
        $state.go('verify', { state: 'register' });
    };

    $scope.goToResetPassword = function () {
        $state.go('verify', { state: 'reset_password' });
    };

    $scope.determineRegisterButtonClass = function () {
        return ($localStorage.hasBeenInRegister === true ||
                angular.isDefined($localStorage.user)) ? null : 'notify-pulse';
    };

    $scope.login = function (user) {
        var number;

        if (angular.isDefined(user) && user.phoneNumber && user.password) {
            number = user.phoneNumber;

            if (number.charAt(0) !== '+') {
                number = '+' + number;
            }

            if (!intlTelInputUtils.isValidNumber(number) && window.env.environment === 'PRODUCTION') {
                modalFactory.alert($translate.instant('ERROR'), $translate.instant('NUMBER_NOT_INTL', { number: number }));
                return;
            }

            number = user.phoneNumber.replace(/[ +]/g, '');

            $scope.isLoginButtonDisabled = true;
            apiFactory.auth.login(number, user.password)
            .then(function success(loggedInUser) {
                $localStorage.user  =  loggedInUser;
                $localStorage.token = loggedInUser.token;
                loginCompleted(loggedInUser.phoneNumber);
            })
            .catch(function (error) {
                var name = error.name;

                $scope.isLoginButtonDisabled = false;

                if (name.toLowerCase() === apiFactory.errorTypes.GENERIC.UNSPECIFIED_ERROR) {
                    name = 'TIMEOUT_ERROR';
                }

                modalFactory.alert($translate.instant('ERROR'), $translate.instant(name));
            });
        } else if (user && !user.phoneNumber) {
            modalFactory.alert($translate.instant('ERROR'), $translate.instant('MALFORMED_NUMBER'));
        } else if (user && !user.password) {
            modalFactory.alert($translate.instant('ERROR'), $translate.instant('PASSWORD_MISSING'));
        }
    };
});

