'use strict';

/*
 * Controller for the verification screen
 */

angular.module('verify', [])
.controller('VerifyCtrl', function($scope, $state, $localStorage, $ionicPopup, $translate, modalFactory, apiFactory, configFactory) {

    var goToRegister = function () {
        $state.go('register')
    }

    $scope.goToRegister = goToRegister;

    $scope.signup = function (phone) {
        if (phone) {
            var number = phone.replace(/[ +]/g, '');
            var isNumber = /^\d+$/.test(number);

            if (isNumber) {
                apiFactory.auth.verify(number)
                    .then(function success(results) {
                        goToRegister();
                    })
                    .catch(function (error) {
                        var name = error.name;

                        if (name.toLowerCase() === apiFactory.errorTypes.GENERIC.UNSPECIFIED_ERROR) {
                            name = 'TIMEOUT_ERROR';
                        }

                        modalFactory.alert($translate.instant('ERROR'), $translate.instant(name));
                    })
            } else {
                modalFactory.alert($translate.instant('ERROR'), $translate.instant('MALFORMED_NUMBER'))
            }
        }
    }
});

