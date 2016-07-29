'use strict';

/*
 * Module for tracking user actions
 */

angular.module('trackinghandler', [])
.factory('trackingFactory', function ($ionicAnalytics, $localStorage, $window) {
    var trackingTypes = {
        LOGIN: 'User logged in',
        REGISTER: 'User registered',
        LOGOUT: 'User logged out',
        VERIFY: 'User requested verification code',
        CALL_INIT: 'User initialized a call',
        CALL_RECEIVE: 'User received a call',
        CALL_END: 'A call was ended',
        PEERJS_ERROR: 'PeerJS error',
        SOCKETIO_ERROR: 'Socket.io error'
    };

    var registerGlobals = function () {
        $ionicAnalytics.setGlobalProperties({
            app_version_number: $window.env.version
        });
    };

    var mergeDefaultParams = function (params) {
        if (!params) params = {};

        var addedParams = { time_stamp: Date.now() };

        if ($localStorage.user) {
            addedParams.currentUser = { phoneNumber: $localStorage.user.phoneNumber };
        }

        return _.merge(params, addedParams);
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
        },

        track: {
            auth: {
                login: function () {
                    trackEvent(trackingTypes.LOGIN);
                },
                register: function () {
                    trackEvent(trackingTypes.REGISTER);
                },
                logout: function () {
                    trackEvent(trackingTypes.LOGOUT);
                },
                verify: function (opts) {
                    trackEvent(trackingTypes.VERIFY, opts);
                },
            },
            call: {
                started: function (opts) {
                    trackEvent(trackingTypes.CALL_INIT, opts);
                },
                received: function (opts) {
                    trackEvent(trackingTypes.CALL_RECEIVE, opts);
                },
                ended: function (opts) {
                    trackEvent(trackingTypes.CALL_END, opts);
                }
            }
        }
    };
});

