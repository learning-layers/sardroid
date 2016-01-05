'use strict';

/*
 * Controller for the registering screen 
 */

angular.module('register', [])
.controller('RegisterCtrl', function($scope, $state, $localStorage, $translate, $http, $ionicPopup, configFactory) {
    var url = configFactory.getValue('apiUrl');

    $scope.register = function (newUser) {

        if (!newUser || !newUser.password || !newUser.passwordAgain || !newUser.code) {
            return;
        }

        if (newUser.password !== newUser.passwordAgain) {
            var callEndedAlert = $ionicPopup.alert({
                title: $translate.instant('PASSWORD_ERROR'),
                template:$translate.instant('PASSWORD_NO_MATCH') 
            });
            callEndedAlert.then(function() {
                newUser.password      = "";
                newUser.passwordAgain = "";
            });
        }
    };
});

