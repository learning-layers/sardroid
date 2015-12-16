'use strict';

/*
 * Module for various socket.io related shenaningans!
 */

var sockethandler = angular.module('sockethandler', []);

sockethandler.factory('socketFactory', function ($rootScope, configFactory, contactsFactory) {

    // The actual websocket connection where most of the magic happens
    var socket = null;

    var config = configFactory.getValue('socketio');

    return {
        connectToServer: function() {
            socket = io.connect(config.url);

            socket.on('connect', function() {
                console.log('Succesfully connected!');
            });

            socket.on('connect_error', function(err) {
                console.log(err);
            });

            socket.on('sockettest', function(data) {
                console.log(data);
            });

            socket.on('contact:online', function(data) {
                console.log('User is online');
                console.log(data);
                contactsFactory.setContactState(data.peerJSId, contactsFactory.contactStates.ONLINE);
            })

            socket.on('contact:offline', function(data) {
                console.log('User is offline');
                console.log(data);
                contactsFactory.setContactState(data.peerJSId, contactsFactory.contactStates.OFFLINE);
            })
        },
        disconnectFromServer: function () {
            if (socket) {
                socket.disconnect();
            }
        }
    };
});

