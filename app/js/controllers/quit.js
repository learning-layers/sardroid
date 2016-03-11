'use strict';

/*
 * Teensy controller for handling the quit button in the side menu
 */

angular.module('quit', [])
.controller('QuitCtrl', function ($scope, apiFactory) {
    $scope.exit  = function () {
        apiFactory.auth.logout()
            .then(function () {
                navigator.app.exitApp();
            })
            .catch(function () {
                navigator.app.exitApp();
        });
    };
});

