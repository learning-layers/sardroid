'use strict';

/*
 * Module for handling push notifications
 */

angular.module('notificationhandler', [])
.factory('notificationFactory', function ($ionicPlatform, $ionicPush, apiFactory) {
    var currentDeviceToken = null;

    var onRegister = function (data) {
        currentDeviceToken = data.token;
        apiFactory.user.notifications.registerDevice(data.token)
        .then(function (res) {
            console.log(res);
        })
        .catch(function (error) {
            console.log(error);
        });
    };

    var onNotification = function (notification) { /* No-op for now! */ };

    $ionicPlatform.ready(function () {
        $ionicPush.init({
            debug: window.env.environment === 'development',
            onRegister: onRegister,
            onNotification: onNotification
        });
    });

    return {
        getCurrentDeviceToken: function () {
            return currentDeviceToken;
        },
        removeCurrentDeviceToken: function () {
            currentDeviceToken = null;
        },
        register: function () {
            $ionicPush.register();
        },
        unregister: function () {
            $ionicPush.unregister();
        }
    };
});

