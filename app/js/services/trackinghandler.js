'use strict';

/*
 * Module for tracking user actions
 */

angular.module('trackinghandler', [])
.factory('trackingFactory', function ($ionicAnalytics, $window) {

    return {
        registerAnalytics: function () {
            $ionicAnalytics.register({
                dryRun: $window.env.environment === 'development'
            });
        }
    };
});

