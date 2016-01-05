'use strict';

/*
 * Just a boring ol' data storage for configration
 */

var confighandler = angular.module('confighandler', []);

confighandler.factory('configFactory', function () {
    
    // Set up configuration variables we can use anywhere in Angular
    var config = {
        apiUrl: 'http://192.168.0.12:9000/',
        onlineContactsLocation: 'http://10.100.51.184:9000/peerjs/peerjs/peers',
        peerjs: {
            host: '192.168.0.12',
            port: 9000,
            path: '/peerjs',
            debug: 3,
            secure: false,
            config: {'iceServers': [
                { 'url': 'turn:188.166.88.67:3478?transport=tcp' },
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
            url: 'http://192.168.0.12:9000'
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

