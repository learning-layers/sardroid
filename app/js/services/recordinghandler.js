'use strict';

/*
 * Module for recording calls on the user's device (strictly for research purposes!)
 */

angular.module('recordinghandler', [])
.factory('recordingFactory', function () {
    var videoRecorder = null;
    var audioRecorder = null;

    return {
        initializeRecordingVideo: function (elementToRecord) {
            if (!videoRecorder) {
                videoRecorder = RecordRTC(elementToRecord, {
                    type: 'canvas',
                    bitsPerSecond: 32000,
                    frameInterval: 1000
                });
            }

        },
        initializeRecordingAudio: function (audioStream) {
            if (!audioRecorder) {
                audioRecorder = RecordRTC(audioStream, {
                    type: 'audio',
                    numberOfAudioChannels: 1
                });
            }
        },
        startRecording: function () {
            return new Promise(function (resolve, reject) {
                if (videoRecorder && audioRecorder) {
                    videoRecorder.initRecorder(function () {
                        audioRecorder.initRecorder(function () {
                            videoRecorder.startRecording();
                            audioRecorder.startRecording();
                            resolve();
                        });
                    });
                } else {
                    reject();
                }
            });
        },
        stopRecording: function () {
            return new Promise(function (resolve, reject) {
                videoRecorder.stopRecording(function (videoUrl) {
                    audioRecorder.stopRecording(function (audioUrl) {
                        var videoBlob = videoRecorder.getBlob();
                        var audioBlob = audioRecorder.getBlob();

                        resolve({ videoUrl: videoRecorder.toURL(), videoBlob: videoBlob,
                                audioUrl: audioRecorder.toURL(), audioBlob: audioBlob });
                    })

                });
            });
        },
        clearRecordedData: function () {
            if (videoRecorder) {
                videoRecorder.clearRecordedData();
                videoRecorder = null;
            }

            if (audioRecorder) {
                audioRecorder.clearRecordedData();
                audioRecorder = null;
            }
        }
    };
});

