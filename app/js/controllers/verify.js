'use strict';

/*
 * Controller for the verification screen
 */

angular.module('verify', [])
.controller('VerifyCtrl', function($scope, $state, $localStorage,$ionicPopup,  apiFactory, configFactory) {

    var goToRegister = function () {
        $state.go('register')
    }

    $scope.goToRegister = goToRegister;

    $scope.signup = function (phone) {
        if (phone) {
            var number = phone.replace(' ', '');
            //TODO: Do this better
            if (number.substring(0,4) !== '+358') {
                var malformedMessagePopup = $ionicPopup.alert({
                    title: 'Error!',
                    template: 'Your number must begin with +358'
                });

                malformedMessagePopup.then(function() {
                    $scope.phone = "";
                });

            } else {
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
    }
});

