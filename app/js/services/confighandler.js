'use strict';

/*
 * Just a boring ol' data storage for configuration
 * DEV VERSION FOR EASE OF USAGE!!!
 */

angular.module('confighandler', [])
.factory('configFactory', function ($log, $window) {
    // Set up configuration variables we can use anywhere in Angular
    var config = {
        production: {
            apiUrl: 'https://mattij.com:9000/',
            peerjs: {
                host: 'mattij.com',
                port: 9000,
                path: '/peerjs',
                debug: 0,
                secure: true,
                config: { iceServers: [
                    {
                        url        : 'turn:layersbox.aalto.fi:3478',
                        username   :  $window.env.turnServer.username,
                        credential :  $window.env.turnServer.password
                    },
                    { url: 'stun:stun.l.google.com:19302' },
                    { url: 'stun:stun1.l.google.com:19302' },
                    { url: 'stun:stun2.l.google.com:19302' },
                    { url: 'stun:stun3.l.google.com:19302' }
                ] } },
            drawings: {
                size: {
                    width:  1,
                    height: 1
                },
                remoteColor: 'red',
                localColor:  '#387ef5',
                brushWidth:   5,
                drawingRemoveTime: 6000,
                arrows: {
                    strokeWidth : 6,
                    headWidth   : 40,
                    headHeight  : 35
                }
            },
            socketio: {
                url: 'https://mattij.com:9000'
            },
            initialUserSettings: {
                saveCalls: true,
                callRecordingInterval: 1500
            }
        },
        development: {
            apiUrl: 'http://10.100.41.51:9000/',
            peerjs: {
                host: '10.100.41.51',
                port: 9000,
                path: '/peerjs',
                debug: 0,
                secure: false,
                config: { iceServers: [
                    {
                        url        : 'turn:layersbox.aalto.fi:3478',
                        username   :  $window.env.turnServer.username,
                        credential :  $window.env.turnServer.password
                    },
                    { url: 'stun:stun.l.google.com:19302' },
                    { url: 'stun:stun1.l.google.com:19302' },
                    { url: 'stun:stun2.l.google.com:19302' },
                    { url: 'stun:stun3.l.google.com:19302' }
                ] } },
            drawings: {
                size: {
                    width:  1,
                    height: 1
                },
                remoteColor: 'red',
                localColor:  '#387ef5',
                brushWidth:   5,
                drawingRemoveTime: 6000,
                arrows: {
                    strokeWidth : 6,
                    headWidth   : 40,
                    headHeight  : 35
                }
            },
            socketio: {
                url: 'http://10.100.41.51:9000'
            },
            initialUserSettings: {
                saveCalls: false,
                callRecordingInterval: 1500
            }
        }
    };

    return {
        getConfig: function () {
            return config;
        },
        getValue: function (key) {
            var val = config[$window.env.environment][key];

            if (!val) {
                $log.error('Error, tried to get nonexistant config value of key ' + key);
            }

            return val;
        }
    };
});

