'use strict';

/*
 * Module for recording calls on the user's device (strictly for research purposes!)
 */

angular.module('recordinghandler', [])
.factory('recordingFactory', function ($ionicPlatform, $sce) {
    var recorder = null;

    return {
        startRecording: function (elementToRecord) {
            if (!recorder) {
                recorder = RecordRTC(elementToRecord, {
                    type: 'canvas'
                });
                recorder.startRecording();
            }
        },
        stopRecording: function () {
            return new Promise(function (resolve, reject) {
                recorder.stopRecording(function (videoUrl) {
                    var blob = recorder.getBlob();

                    resolve({ videoUrl: recorder.toURL(), blob: blob });
                });
            });
        },
        clearRecordedData: function () {
            recorder.clearRecordedData();
            recorder = null;
        }
    };
});

