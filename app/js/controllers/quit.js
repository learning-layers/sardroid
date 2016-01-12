'use strict';
/*
 * Teensy controller for handling the quit button in the side menu
 */

angular.module('quit', [])

    .controller('QuitCtrl', function($scope, apiFactory) {
        $scope.exit  = function() {

            apiFactory.auth.logout()
                .then(function (results) {
                    navigator.app.exitApp();
                })
                .catch(function (error) {
                    navigator.app.exitApp();
                })

        };
});

