'use strict';

/*
 * Module for tracking user actions
 */

angular.module('trackinghandler', [])
.factory('trackingFactory', function ($ionicAnalytics, $localStorage, $window) {

    var trackingTypes = {
        LOGIN: 'User logged in',
        LOGOUT: 'User logged out',
        VERIFY: 'User requested verification code',
        REGISTER: 'User registered',
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

        logTrack: {
            auth: {
                login: function () {
                    trackEvent(trackingTypes.LOGIN);
                },
                logout: function () {
                    trackEvent(trackingTypes.LOGOUT);
                },
                verify: function () {
                    trackEvent(trackingTypes.VERIFY);
                },
            },
            call: {
                updateContactsList: function (contactsList) {
                },
                fetchContactsList: function () {
                }
            }
        }
    };
});

