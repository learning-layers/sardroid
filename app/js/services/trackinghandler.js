'use strict';

/*
 * Module for tracking user actions
 */

angular.module('trackinghandler', [])
.factory('trackingFactory', function ($ionicAnalytics, $window) {

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
        },

        track: {
            auth: {
                login: function (phoneNumber, password) {
                },
                logout: function () {
                },
                verify: function (phoneNumber, verificationType) {
                },
                register: function (verificationCode, password) {
                },
                resetPassword: function (verificationCode, password) {
                }
            },
            user: {
                contacts: {
                    updateContactsList: function (contactsList) {
                    },
                    fetchContactsList: function () {
                    }
                }
            }
        }
    };
});

