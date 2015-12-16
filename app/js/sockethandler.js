'use strict';

/*
 * Module for various socket.io related shenaningans!
 */

var sockethandler = angular.module('sockethandler', []);

sockethandler.factory('socketFactory', function ($rootScope) {

    // The actual websocket connection where most of the magic happens
    var socket = null;

    return {
        connectToServer: function () {
            socket = io.connect('http://localhost:9000');

            socket.on('connect', function() {
                console.log('Succesfully connected!');
            });

            socket.on('connect_error', function(err) {
                console.log(err);
            });
        }
    };
});

