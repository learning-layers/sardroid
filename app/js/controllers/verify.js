'use strict';

/*
 * Controller for the verification screen
 */

angular.module('verify', [])
.controller('VerifyCtrl', function($scope, $state, $localStorage, $http, configFactory) {

    var url = configFactory.getValue('apiUrl');

    var goToRegister = function () {
        $state.go('register')
    }

    $scope.goToRegister = goToRegister;
    
    $scope.signup = function (phone) {
        if (phone) {
            var number = phone.replace(' ', '');


            /*$http.post(
                config.url + '/auth/verification',
                { phoneNumber: number }
            ).then(function success(results) {
                console.log(results);
            }, function error(err) {
                console.log(err);
            }) */
            goToRegister();
        }
    }
});

