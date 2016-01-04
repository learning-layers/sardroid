'use strict';

/*
 * Controller for the registering screen 
 */

angular.module('verify', [])
.controller('VerifyCtrl', function($scope, $state, $localStorage, $http, configFactory) {

    var config = configFactory.getValue('api');

    var goToRegister = function () {
        console.log('asdasdasd');
        $state.go('register')
    }

    $scope.goToRegister = goToRegister;
    
    $scope.signup = function (user) {
        if (user.phone) {
            var number = user.phone.replace(' ', '');


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

