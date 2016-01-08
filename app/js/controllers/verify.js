'use strict';

/*
 * Controller for the verification screen
 */

angular.module('verify', [])
.controller('VerifyCtrl', function($scope, $state, $localStorage, apiFactory, configFactory) {

    var goToRegister = function () {
        $state.go('register')
    }

    $scope.goToRegister = goToRegister;

    $scope.signup = function (phone) {
        if (phone) {
            var number = phone.replace(' ', '');

            apiFactory.auth.verify(number)
                .then(function success(results) {
                    console.log(results);
                    goToRegister();
                })
                .catch(function (error) {
                    console.log(error);
                })
        }
    }
});

