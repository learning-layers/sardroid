'use strict';

/*
 * Controller for the registering screen 
 */

angular.module('verify', [])
.controller('VerifyCtrl', function($scope, $state, $localStorage, $http, configFactory) {

    var config = configFactory.getValue('api');

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

            $state.go('register');
        }
    }
});

