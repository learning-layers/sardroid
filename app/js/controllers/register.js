'use strict';

/*
 * Controller for the registering screen, also handles resetting passwords. Sneaky!
 */

angular.module('register', [])
.controller('RegisterCtrl', function ($scope, $state, $localStorage, $translate, $stateParams, apiFactory, modalFactory,
                                      configFactory, contactsFactory) {
    var currentState = $stateParams.state;

    if (currentState === 'register') {
        $scope.textTranslation   = 'VERIFY_NUMBER_REGISTER_TEXT';
        $scope.headerTranslation = 'REGISTER_NUMBER_HEADER';
        $scope.buttonTranslation = 'REGISTER';
    } else if (currentState === 'reset_password') {
        $scope.textTranslation   = 'VERIFY_NUMBER_PASSWORD_TEXT';
        $scope.headerTranslation = 'RESET_PASSWORD_HEADER';
        $scope.buttonTranslation = 'RESET_PASSWORD';
    }

    $scope.isSignUpButtonDisabled = false;

    $scope.submit = function (user) {
        var requestType;

        if (!user.code) {
            modalFactory.alert($translate.instant('ERROR'), $translate.instant('CODE_MISSING'));
            return;
        }

        if (!user.password) {
            modalFactory.alert($translate.instant('ERROR'), $translate.instant('PASSWORD_MISSING'));
            return;
        }

        if (!user.passwordAgain) {
            modalFactory.alert($translate.instant('ERROR'), $translate.instant('PASSWORD_AGAIN_MISSING'));
            return;
        }

        if (user.password !== user.passwordAgain) {
            modalFactory.alert(
                $translate.instant('PASSWORD_ERROR'),
                $translate.instant('PASSWORD_NO_MATCH')
            )
            .then(function () {
                user.password      = '';
                user.passwordAgain = '';
            });
        } else {
            $scope.isSignUpButtonDisabled = true;
            requestType = currentState === 'register' ? apiFactory.auth.register : apiFactory.auth.resetPassword;

            requestType(user.code, user.password)
            .then(function success(verifiedUser) {
                $localStorage.user = verifiedUser;
                $localStorage.token = verifiedUser.token;
                apiFactory.setApiToken(verifiedUser.token);

                return contactsFactory.syncContactsWithServer();
            })
            .then(function () {
                $state.go('login');
            })
            .catch(function (error) {
                var name = error.name;
                $scope.isSignUpButtonDisabled = false;

                if (name.toLowerCase() === apiFactory.errorTypes.GENERIC.UNSPECIFIED_ERROR) {
                    name = 'TIMEOUT_ERROR';
                }

                modalFactory.alert($translate.instant('ERROR'), $translate.instant(name));
            });
        }
    };
});

