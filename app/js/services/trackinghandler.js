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

    var mergeDefaultParams = function (params) {
        return _.merge(params, { time_stamp: Date.now() });
    };

    var trackEvent = function (name, payload) {
        $ionicAnalytics.track(name, mergeDefaultParams(payload));
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

