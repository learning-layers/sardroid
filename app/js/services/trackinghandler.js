'use strict';

/*
 * Module for tracking user actions
 */

angular.module('trackinghandler', [])
.factory('trackingFactory', function ($ionicAnalytics, $window) {

    var registerGlobals = function () {
        $ionicAnalytics.setGlobalProperties({
            app_version_number: $window.env.version
        });
    };

    return {
        registerAnalytics: function () {
            $ionicAnalytics.register({
                dryRun: $window.env.environment === 'development'
            });

            registerGlobals();
        }
    };
});

