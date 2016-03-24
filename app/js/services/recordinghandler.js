'use strict';

/*
 * Module for recording calls on the user's device (strictly for research purposes!)
 */

angular.module('recordinghandler', [])
.factory('recordingFactory', function (settingsFactory) {
    var videoRecorder  = null;
    var localRecorder  = null;
    var remoteRecorder = null

    var frameInterval = settingsFactory.getSetting('callRecordingInterval');

    var initializeLocalAudio = function (audioStream) {
        if (!localRecorder) {
            localRecorder = RecordRTC(audioStream, {
                type: 'audio',
                numberOfAudioChannels: 1
            });
        }
    }

    var initializeRemoteAudio = function (audioStream) {
        if (!remoteRecorder) {
            remoteRecorder = RecordRTC(audioStream, {
                type: 'audio',
                numberOfAudioChannels: 1
            });
        }
    }

    return {
        initializeRecordingVideo: function (elementToRecord) {
            if (!videoRecorder) {
                videoRecorder = RecordRTC(elementToRecord, {
                    type: 'canvas',
                    bitsPerSecond: 32000,
                    frameInterval: frameInterval
                });
            }
        },
        initializeRecordingAudio: function (opts) {
            switch (opts.source) {
                case 'local':
                    initializeLocalAudio(opts.audioStream);
                break;
                case 'remote':
                    initializeRemoteAudio(opts.audioStream);
                break;
            }
        },
        startRecording: function () {
            return new Promise(function (resolve, reject) {
                // TODO: Make this look better?
                if (videoRecorder && localRecorder && remoteRecorder) {
                    videoRecorder.initRecorder(function () {
                        localRecorder.initRecorder(function () {
                            remoteRecorder.initRecorder(function () {
                                videoRecorder.startRecording();
                                remoteRecorder.startRecording();
                                localRecorder.startRecording();
                                resolve();
                            });
                        });
                    });
                } else {
                    reject();
                }
            });
        },
        stopRecording: function () {
            return new Promise(function (resolve) {
                videoRecorder.stopRecording(function () {
                    localRecorder.stopRecording(function () {
                        remoteRecorder.stopRecording(function () {
                            var videoBlob       = videoRecorder.getBlob();
                            var remoteAudioBlob = remoteRecorder.getBlob();
                            var localAudioBlob  = localRecorder.getBlob();

                            resolve({
                                videoBlob: videoBlob,
                                remoteAudioBlob: remoteAudioBlob,
                                localAudioBlob: localAudioBlob
                            });
                        });
                    });
                });
            });
        },
        clearRecordedData: function () {
            if (videoRecorder) {
                videoRecorder.clearRecordedData();
                videoRecorder = null;
            }

            if (localRecorder) {
                localRecorder.clearRecordedData();
                localRecorder = null;
            }

            if (remoteRecorder) {
                remoteRecorder.clearRecordedData();
                remoteRecorder = null;
            }
        }
    };
});

