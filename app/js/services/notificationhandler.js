'use strict';

/*
 * Module for registering the device for push notifications with the backend server
 */

angular.module('notificationhandler', [])
.factory('notificationFactory', function ($ionicPlatform, $ionicPush, apiFactory) {
    var onRegister = function (data) {
        console.log(data.token);
        apiFactory.user.notifications.registerDevice(data.token)
        .then(function (res) {
            console.log(res);
        })
        .catch(function (error) {
            console.log(error);
        });
    };

    var onNotification = function (notification) {
        console.log(notification);
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

