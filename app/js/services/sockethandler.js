'use strict';

/*
 * Module for various socket.io related shenaningans!
 */

var sockethandler = angular.module('sockethandler', []);

sockethandler.factory('socketFactory', function ($rootScope, $state, configFactory) {

    // The actual websocket connection where most of the magic happens
    var socket = null;

    var eventTypes = {
        CONNECT         : 'connect',
        CONNECT_ERROR   : 'connect_error',
        TOKEN_INVALID   : 'token_invalid',
        CONTACT_ONLINE  : 'contact:online',
        CONTACT_OFFLINE : 'contact:offline'
    };

    // Array of callbacks
    var dataCallbacks = [];

    var config = configFactory.getValue('socketio');

    var getCallbacksByType = function (type) {
        return _.where(dataCallbacks, {eventType: type});
    }

    var callCallbacks = function (type, data) {
        var callbackArray = getCallbacksByType(type);

        if (callbackArray) {
            var len = callbackArray.length;

            for (var i = 0; i < len; i++) {
                callbackArray[i].callback(data)
            }
        }
    }

    return {
        eventTypes: eventTypes,

        connectToServer: function(token) {
            socket = io.connect(config.url, { query: "token=" + token });

            socket.on(eventTypes.CONNECT, function() {
                console.log('Succesfully connected!');
            });

            socket.on(eventTypes.CONNECT_ERROR, function(err) {
                console.log(err);
            });

            socket.on(eventTypes.TOKEN_INVALID, function(data) {
                console.log('Token is invalid!');
                disconnectFromServer();
                $state.go('login');
            });

            socket.on(eventTypes.CONTACT_ONLINE, function(data) {
                console.log('User is online');
                data.eventType = eventTypes.CONTACT_ONLINE;
                callCallbacks(eventTypes.CONTACT_ONLINE, data);
            });

            socket.on(eventTypes.CONTACT_OFFLINE, function(data) {
                console.log('User is offline');
                data.eventType = eventTypes.CONTACT_OFFLINE;
                callCallbacks(eventTypes.CONTACT_OFFLINE, data);
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

