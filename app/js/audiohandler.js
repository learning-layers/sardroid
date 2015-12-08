'use strict';

var audiohandler = angular.module('audiohandler', []);

audiohandler.factory('audioFactory', function() {
    return {
        playSound: function(selector) {
            var audio = document.querySelector(selector);
            audio.play();
        },
        stopSound: function(selector) {
            var audio = document.querySelector(selector);
            audio.pause();
            audio.currentTime = 0;
        },
        stopAllSounds: function() {
            var elements = document.querySelectorAll('audio');
            var len = elements.length;
            for (var i = 0; i < len; i++) {
                elements[i].pause();
                elements[i].currentTime = 0;
            }
        }
    }
});
