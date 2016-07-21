'use strict';

/*
 * Module for registering the device for push notifications with the backend server
 */

angular.module('notificationhandler', [])
.factory('notificationFactory', function ($ionicPlatform, $ionicPush, configFactory) {
    var onRegister = function (data) {
        console.log(data.token);
    };

    var onNotification = function (notification) {

    };

    $ionicPlatform.ready(function () {
        $ionicPush.init({
            debug: window.env.environment === 'development',
            onRegister: onRegister,
            onNotification: onNotification
        });
    });

    return {
        register: function () {
            $ionicPush.register();
        },
        unregister: function () {
            $ionicPush.unregister();
        }
    };
});

