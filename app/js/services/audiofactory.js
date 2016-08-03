'use strict';

/*
 * Module for playing audio, now the Angular way!
 */

angular.module('audiohandler', [])
.factory('audioFactory', function ($ionicPlatform, $window, $cordovaNativeAudio) {
    $ionicPlatform.ready(function () {
        if ($window.cordova) {
            $cordovaNativeAudio.preloadComplex('dial', 'res/sounds/dial.wav', 1, 1);
            $cordovaNativeAudio.preloadComplex('call', 'res/sounds/incoming.mp3', 1, 1);
            $cordovaNativeAudio.preloadComplex('shutter', 'res/sounds/shutter.wav', 1, 1);
        }
    });
    return {
        playSound: function (sound) {
            if ($window.cordova) {
                $cordovaNativeAudio.play(sound);
            }
        },
        loopSound: function (sound) {
            if ($window.cordova) {
                $cordovaNativeAudio.loop(sound);
            }
        },
        stopSound: function (sound) {
            if ($window.cordova) {
                $cordovaNativeAudio.stop(sound);
            }
        },
        stopAllSounds: function () {
            if ($window.cordova) {
                this.stopSound('call');
                this.stopSound('dial');
                this.stopSound('shutter');
            }
        }
    };
});

