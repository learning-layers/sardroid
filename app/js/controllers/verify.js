'use strict';

/*
 * Controller for the verification screen, verification requests can be made for registering
 * or resetting your password
 */

angular.module('verify', [])
.controller('VerifyCtrl', function($scope, $state, $localStorage, $translate, $http, $stateParams, modalFactory, apiFactory, configFactory) {

    $scope.isVerifyButtonDisabled = false;
    var currentState = $stateParams.state;

    if (currentState === 'register') {
        $scope.textTranslation = 'VERIFY_NUMBER_REGISTER_TEXT';
    } else if (currentState === 'reset_password') {
        $scope.textTranslation = 'VERIFY_NUMBER_PASSWORD_TEXT';
    }

    var goToRegister = function () {
        $state.go('register', { state: currentState })
    }

    $scope.goToRegister = goToRegister;

    $scope.signup = function (phone) {
        if (phone) {
            var number = phone.replace(/[ +]/g, '');
            var isNumber = /^\d+$/.test(number);

            if (isNumber) {
                $scope.isVerifyButtonDisabled = true;
                apiFactory.auth.verify(number, currentState)
                    .then(function success(results) {
                        goToRegister();
                    })
                    .catch(function (error) {
                        var name = error.name;
                        $scope.isVerifyButtonDisabled = false;

                        if (name.toLowerCase() === apiFactory.errorTypes.GENERIC.TWILIO_ERROR ) {
                            modalFactory.alert($translate.instant('ERROR'), error.message);
                        }
                        else {
                            if (name.toLowerCase() === apiFactory.errorTypes.GENERIC.UNSPECIFIED_ERROR) {
                                name = 'TIMEOUT_ERROR';
                            }

                            modalFactory.alert($translate.instant('ERROR'), $translate.instant(name));
                        }
                    })
            } else {
                modalFactory.alert($translate.instant('ERROR'), $translate.instant('MALFORMED_NUMBER'))
            }
        }
    }
});

