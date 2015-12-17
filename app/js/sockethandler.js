'use strict';

/*
 * Module for various socket.io related shenaningans!
 */

var sockethandler = angular.module('sockethandler', []);

sockethandler.factory('socketFactory', function ($rootScope, configFactory, contactsFactory) {

    // The actual websocket connection where most of the magic happens
    var socket = null;

    var eventTypes = {
        CONNECT: 'connect',
        CONNECT_ERROR: 'connect_error',
        CONTACT_ONLINE: 'contact:online',
        CONTACT_OFFLINE: 'contact:offline'
    };

    // Array of callbacks
    var callbacks = [];

    var config = configFactory.getValue('socketio');

    var getCallbacksByType = function (type) {
        return _.where(callbacks, {eventType: type});
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

        connectToServer: function() {
            socket = io.connect(config.url);

            socket.on(eventTypes.CONNECT, function() {
                console.log('Succesfully connected!');
            });

            socket.on(eventTypes.CONNECT_ERROR, function(err) {
                console.log(err);
            });

            socket.on('sockettest', function(data) {
            });

            socket.on(eventTypes.CONTACT_ONLINE, function(data) {
                console.log('User is online');
                console.log(data);

                contactsFactory.setContactState(data.peerJSId, contactsFactory.contactStates.ONLINE);
                callCallbacks(eventTypes.CONTACT_ONLINE, data);
            })

            socket.on(eventTypes.CONTACT_OFFLINE, function(data) {
                console.log('User is offline');
                console.log(data);

                contactsFactory.setContactState(data.peerJSId, contactsFactory.contactStates.OFFLINE);
                callCallbacks(eventTypes.CONTACT_ONLINE, data);
            })
        },

        disconnectFromServer: function () {
            if (socket) {
                socket.disconnect();
            }
        },
        
        registerCallback: function (eventType, callback) {
            callbacks.push({
                eventType: eventType,
                callback:  callback
            });
        },
        
        clearAllCallbacks: function () {
            callbacks = [];
        }
    };
});

