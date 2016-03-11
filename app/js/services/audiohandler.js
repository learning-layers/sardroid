'use strict';

/*
 * Module for playing audio, now the Angular way!
 */

angular.module('audiohandler', [])
.factory('audioFactory', function ($document) {

    return {
        playSound: function (selector) {

            var audio = $document[0].querySelector(selector);
            audio.play();

        },
        stopSound: function (selector) {

            var audio = $document[0].querySelector(selector);
            audio.pause();
            audio.currentTime = 0;

        },
        stopAllSounds: function () {

            var elements = $document[0].querySelectorAll('audio');
            var len      = elements.length;
            var i        = 0;

            for (i = 0; i < len; i++) {

                elements[i].pause();
                elements[i].currentTime = 0;

            }

        }
    };

});

