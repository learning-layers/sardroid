'use strict';

/*
 * Module for various socket.io related shenaningans!
 */

angular.module('sockethandler', [])
.factory('socketFactory', function ($rootScope, $log, $state, configFactory) {
    // The actual websocket connection where most of the magic happens
    var socket = null;

    var eventTypes = {
        CONNECT         : 'connect',
        HEARTBEAT_PING  : 'heartbeat_ping',
        HEARTBEAT_PONG  : 'heartbeat_pong',
        DISCONNECT      : 'disconnect',
        CONNECT_ERROR   : 'connect_error',
        TOKEN_VALID     : 'token_valid',
        TOKEN_INVALID   : 'token_invalid',
        CONTACT_ONLINE  : 'contact:online',
        CONTACT_OFFLINE : 'contact:offline'
    };

    // Array of callbacks
    var dataCallbacks = [];

    var config = configFactory.getValue('socketio');

    var getCallbacksByType = function (type) {
        return _.where(dataCallbacks, { eventType: type });
    };

    var callCallbacks = function (type, data) {
        var callbackArray = getCallbacksByType(type);
        var len           = callbackArray.length;
        var i             = 0;

        if (callbackArray) {
            for (i = 0; i < len; i++) {
                callbackArray[i].callback(data);
            }
        }
    };

    return {
        eventTypes: eventTypes,

        connectToServer: function (token) {
            return new Promise(function (resolve, reject) {
                if (socket && socket.connected === true) {
                    resolve();
                    return;
                }
                socket = io.connect(config.url, { query: 'token=' + token });

                socket.on(eventTypes.CONTACT_ONLINE, function (data) {
                    $log.log('Socket.io: User is online');
                    data.eventType = eventTypes.CONTACT_ONLINE;
                    callCallbacks(eventTypes.CONTACT_ONLINE, data);
                });

                socket.on(eventTypes.CONTACT_OFFLINE, function (data) {
                    $log.log('Socket.io: User is offline');
                    data.eventType = eventTypes.CONTACT_OFFLINE;
                    callCallbacks(eventTypes.CONTACT_OFFLINE, data);
                });

                // These two events are used for authentication
                socket.on(eventTypes.TOKEN_VALID, function () {
                    $log.log('Socket.io: Token is valid!');
                    resolve();
                });

                socket.on(eventTypes.TOKEN_INVALID, function () {
                    $log.log('Socket.io: Token is invalid!');
                    socket.disconnect();
                    reject();
                });

                socket.on(eventTypes.CONNECT, function () {
                    $log.log('Socket.io: Succesfully connected!');
                });

                socket.on(eventTypes.DISCONNECT, function () {
                    $log.log('Socket.io: Disconnected!');
                });

                socket.on(eventTypes.HEARTBEAT_PING, function () {
                    socket.emit(eventTypes.HEARTBEAT_PONG, { beat: 1 });
                });

                socket.on(eventTypes.CONNECT_ERROR, function (err) {
                    $log.log('Socket.io: ', err);
                    reject();
                });
            });
        },

        disconnectFromServer: function () {
            if (socket) {
                socket.disconnect();
            }
        },

        registerCallback: function (eventType, callback) {
            dataCallbacks.push({
                eventType: eventType,
                callback:  callback
            });
        },

        clearAllCallbacks: function () {
            dataCallbacks = [];
        }
    };
});

