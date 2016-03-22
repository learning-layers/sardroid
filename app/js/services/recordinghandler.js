'use strict';

/*
 * Module for recording calls on the user's device (strictly for research purposes!)
 */

angular.module('recordinghandler', [])
.factory('recordingFactory', function () {
    var recorder = null;

    return {
        startRecording: function (elementToRecord) {
            if (!recorder) {
                recorder = RecordRTC(elementToRecord, {
                    type: 'canvas',
                    bitsPerSecond: 32000
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
            if (recorder) {
                recorder.clearRecordedData();
                recorder = null;
            }
        }
    };
});

