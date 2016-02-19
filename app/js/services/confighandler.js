'use strict';

/*
 * Just a boring ol' data storage for configration
 * DEV VERSION FOR EASE OF USAGE!!!
 */

var confighandler = angular.module('confighandler', []);

confighandler.factory('configFactory', function () {

    // Set up configuration variables we can use anywhere in Angular
    var config = {
            production: {
                apiUrl: 'https://mattij.com:9000/',
                onlineContactsLocation: 'https://mattij.com:9000/peerjs/peerjs/peers',
                peerjs: {
                    host: 'mattij.com',
                    port: 9000,
                    path: '/peerjs',
                    debug: 0,
                    secure: true,
                    config: {'iceServers': [
        //                {
        //                    'url'        : 'turn:188.166.88.67:3478',
        //                    'username'   :  window.env.turnServer.username,
        //                    'credential' :  window.env.turnServer.password
        //                },
                        { 'url': 'stun:stun.l.google.com:19302' },
                        { 'url': 'stun:stun1.l.google.com:19302' },
                        { 'url': 'stun:stun2.l.google.com:19302' },
                        { 'url': 'stun:stun3.l.google.com:19302' }
                    ]}},
                drawings: {
                    size: {
                        width:  0.56,
                        height: 0.44
                    },
                    remoteColor: 'red',
                    localColor:  '#387ef5',
                    brushWidth:   5,
                    drawingRemoveTime: 2000
                },
                socketio: {
                    url: 'https://mattij.com:9000'
                }
        },
        development: {
            apiUrl: 'http://10.100.28.191:9000/',
            onlineContactsLocation: 'http://10.100.28.191:9000/peerjs/peerjs/peers',
            peerjs: {
                host: '10.100.28.191',
                port: 9000,
                path: '/peerjs',
                debug: 0,
                secure: false,
                config: {'iceServers': [
                    //                {
                    //                    'url'        : 'turn:188.166.88.67:3478',
                    //                    'username'   :  window.env.turnServer.username,
                    //                    'credential' :  window.env.turnServer.password
                    //                },
                    { 'url': 'stun:stun.l.google.com:19302' },
                    { 'url': 'stun:stun1.l.google.com:19302' },
                    { 'url': 'stun:stun2.l.google.com:19302' },
                    { 'url': 'stun:stun3.l.google.com:19302' }
                ]}},
                drawings: {
                    size: {
                        width:  0.56,
                        height: 0.44
                    },
                    remoteColor: 'red',
                    localColor:  '#387ef5',
                    brushWidth:   5,
                    drawingRemoveTime: 2000
                },
                socketio: {
                    url: 'http://10.100.28.191:9000'
                }

        }
    };

    return {
        getConfig: function () {
            return config
        },
        getValue: function (key) {
            var val = config[window.env.environment][key];

            if (!val) {
                console.error('Error, tried to get nonexistant config value of key ' + key)
            }

            return val;
        }
    };
});

