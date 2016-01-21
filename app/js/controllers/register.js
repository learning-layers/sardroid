'use strict';

/*
 * Controller for the registering screen, also handles resetting passwords. Sneaky!
 */

angular.module('register', [])
.controller('RegisterCtrl', function($scope, $state, $localStorage, $translate, $stateParams, apiFactory, modalFactory, configFactory) {

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

    $scope.submit = function (user) {

        if (!user || !user.password || !user.passwordAgain || !user.code) {
            return;
        }

        if (user.password !== user.passwordAgain) {
            modalFactory.alert(
                $translate.instant('PASSWORD_ERROR'),
                $translate.instant('PASSWORD_NO_MATCH')
            )
            .then(function() {
                user.password      = "";
                user.passwordAgain = "";
            });

        } else {
            var requestType = currentState === 'register' ? apiFactory.auth.register : apiFactory.auth.resetPassword;

            requestType(user.code, user.password)
            .then(function success(results) {
                console.log(results);
                $localStorage.user = results;
                $state.go('login');
            })
            .catch(function (error) {
                var name = error.name;

                if (name.toLowerCase() === apiFactory.errorTypes.GENERIC.UNSPECIFIED_ERROR) {
                    name = 'TIMEOUT_ERROR';
                }

                modalFactory.alert($translate.instant('ERROR'), $translate.instant(name));
            })
        }
    };
});

