'use strict';

/*
 * Just a boring ol' data storage for configration
 */

var confighandler = angular.module('confighandler', []);

confighandler.factory('configFactory', function () {
    
    // Set up configuration variables we can use anywhere in Angular
    var config = {
        apiUrl: 'https://layersbox.aalto.fi/',
        onlineContactsLocation: 'https://layersbox.aalto.fi/peerjs/peerjs/peers',
        peerjs: {
            host: 'layersbox.aalto.fi',
            port: 443,
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
            url: 'https://layersbox.aalto.fi'
        }
    };

    return {
        getConfig: function () {
            return config
        },
        getValue: function (key) {
            return config[key]
        }
    };
});

