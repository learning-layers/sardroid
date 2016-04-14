'use strict';

/*
 * Controller which handles the actual video call part of the app
 * Sets up the canvases, and sets up the correct data callbacks and such...
 */

angular.module('call', [])
.controller('CallCtrl', function ($scope, trackingFactory, recordingFactory, fileFactory, $ionicLoading, settingsFactory, $window, $document, $sce, $stateParams, peerFactory, drawingFactory) {
    var saveCalls = settingsFactory.getSetting('saveCalls');

    var startDate = Date.now();

    var alreadyLeaving = false;

    var leave = function () {
        if (alreadyLeaving === false) {
            alreadyLeaving = true;
            peerFactory.sendDataToPeer({ type: 'otherPeerLeft' });
            trackingFactory.track.call.ended({
                with: $stateParams.user.phoneNumber,
                duration: Date.now() - startDate
            });

            drawingFactory.tearDownDrawingFactory();
            peerFactory.clearCallback('otherPeerLeft');
            peerFactory.clearCallback('toggleRemoteVideo');
            peerFactory.clearCallback('toggleVideoMute');

            if (saveCalls) {
                $ionicLoading.show({ templateUrl: 'templates/modals/save-video-loader.html' });
                recordingFactory.stopRecording()
                .then(function (results) {
                    var name = _.kebabCase($stateParams.user.displayName);
                    var fileNamePrefix = 'call-with-' + name + '-' + Date.now();
                    return Promise.all([
                        fileFactory.writeToFile({
                            fileName : fileNamePrefix + '.webm',
                            data     : results.videoBlob
                        }),
                        fileFactory.writeToFile({
                            fileName : fileNamePrefix + '-local.wav',
                            data     : results.localAudioBlob
                        })
                        //                    fileFactory.writeToFile({
                        //                        fileName : fileNamePrefix + '-remote.wav',
                        //                        data     : results.remoteAudioBlob
                        //                    })
                    ]);
                })
                .then(function (results) {
                    $ionicLoading.hide();
                    recordingFactory.clearRecordedData();
                    peerFactory.endCurrentCall();
                })
                .catch(function (error) {
                    $ionicLoading.hide();
                    recordingFactory.clearRecordedData();
                    peerFactory.endCurrentCall();
                })
            } else {
                peerFactory.endCurrentCall();
            }

        }
    };

    var toggleAudioPlayingState = function (audioSelector) {
        var audio = $document[0].querySelector(audioSelector);

        if (audio.paused === true) {
            audio.play();
        } else {
            audio.pause();
        }
    };


    var toggleRemoteVideoPlayingState = function (data) {
        console.log('settings remote sceen');
        console.log(data);
        if ($window.isRemoteVideoPaused === true && angular.isDefined(data.screen)) {
            remotePauseSrc = $sce.trustAsResourceUrl(window.URL.createObjectURL(Whammy.fromImageArray([data.screen], 1)))

            $scope.remoteStreamSrc = remotePauseSrc
        } else {
            $scope.remoteStreamSrc = remoteStreamSrc;
        }
    };

    var toggleLocalVideoPlayingState = function (data) {
        console.log('settings local sceen');
        console.log(data);
        if ($scope.isOwnVideoPaused === true && angular.isDefined(data.screen)) {

            localPauseSrc = $sce.trustAsResourceUrl(window.URL.createObjectURL(Whammy.fromImageArray([data.screen], 1)));

            $scope.localStreamSrc = localPauseSrc;
        } else {
            $scope.localStreamSrc = localStreamSrc;
        }
    };

    var setRemoteVideoSrc = function (src) {
        if (typeof src === 'string') {
            src = $sce.trustAsResourceUrl(src);
        } else if (src instanceof Blob) {
            src = window.URL.createObjectURL(src);
            src = $sce.trustAsResourceUrl(src);
        }

        $scope.remoteStreamSrc = src;
    };

    var setLocalStreamSrc = function (src) {
        if (typeof src === 'string') {
            src = $sce.trustAsResourceUrl(src);
        } else if (src instanceof Blob) {
            src = window.URL.createObjectURL(src);
            src = $sce.trustAsResourceUrl(src);
        }

        $scope.localStreamSrc = src;
    };

    var draggableVideo = new Draggabilly('#small-video');

    var localStreamSrc  = $sce.trustAsResourceUrl(peerFactory.getLocalStreamSrc());
    var remoteStreamSrc = $sce.trustAsResourceUrl(peerFactory.getRemoteStreamSrc());

    var localPauseSrc  = null;
    var remotePauseSrc = null;

    var getVideoScreen = function (videoSelector) {
        var canvas = document.createElement('canvas');
        var video = document.querySelector(videoSelector);
        var ctx = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        var dataUri = canvas.toDataURL('image/webp');

        return { uri: dataUri };
    }

    if (saveCalls) {
        recordingFactory.initializeRecordingVideo(document.getElementById('local-wrapper'));
        // TODO: Re-enable this once CrossWalk gets to chromium 49
        // https://crosswalk-project.org/documentation/downloads.php
        //recordingFactory.initializeRecordingAudio({ source: 'remote', audioStream: peerFactory.getRemoteStream() });
        recordingFactory.initializeRecordingAudio({ source: 'local',  audioStream: peerFactory.getLocalStream() });
    }

    draggableVideo.on('staticClick', function () {
        // TODO: Refactor this into something more elegant
        if ($scope.currentBigScreen === 'remote-big') {
            $scope.currentBigScreen = 'local-big';
            $scope.currentRemoteVideoLocation = '#small-video';
            $scope.currentLocalVideoLocation = '#big-video';


            if ($scope.isOwnVideoPaused === true) {
                $scope.bigStreamSrc = localPauseSrc;
            } else {
                $scope.bigStreamSrc = localStreamSrc;
            }

            if ($scope.isRemoteVideoPaused === true) {
                $scope.smallStreamSrc = remotePauseSrc;
            } else {
                $scope.smallStreamSrc = remoteStreamSrc;
            }

        } else if ($scope.currentBigScreen === 'local-big') {
            $scope.currentBigScreen = 'remote-big';
            $scope.currentRemoteVideoLocation = '#big-video';
            $scope.currentLocalVideoLocation = '#small-video';

            if ($scope.isOwnVideoPaused === true) {
                $scope.smallStreamSrc = localPauseSrc;
            } else {
                $scope.smallStreamSrc = localStreamSrc;
            }

            if ($scope.isRemoteVideoPaused === true) {
                $scope.bigStreamSrc = remotePauseSrc;
            } else {
                $scope.bigStreamSrc = remoteStreamSrc;
            }

        }
        $scope.$apply();
    });

    drawingFactory.setUpDataCallbacks();
    drawingFactory.setUpRemoteCanvas('remote-canvas', {});
    drawingFactory.setUpLocalCanvas('local-canvas', {});

    peerFactory.registerCallback('otherPeerLeft', function () {
        leave();
    });

    peerFactory.registerCallback('toggleVideoMute', function () {
        toggleAudioPlayingState('#call-audio');
    });

    peerFactory.registerCallback('toggleRemoteVideo', function (data) {
        console.log('data incoming');
        console.log(data);
        $window.isRemoteVideoPaused = !$window.isRemoteVideoPaused;
        toggleRemoteVideoPlayingState(data.data);
    });

    $scope.currentBigScreen = 'remote-big';

    // I have no idea what is so special about this variable
    // but we have to declare it as a global so angular doesn't
    // override it
    $window.isRemoteVideoPaused = false;
    $scope.isOwnVideoPaused     = false;
    $scope.isOwnStreamMuted     = false;
    $scope.isArrowModeOn        = false;

    $scope.currentRemoteVideoLocation = '#big-video';
    $scope.currentLocalVideoLocation  = '#small-video';

    $scope.determinePauseButtonClass = function () {
        if ($scope.isOwnVideoPaused === true) {
            return 'ion-play';
        } else if ($scope.isOwnVideoPaused === false) {
            return 'ion-pause';
        }
    };

    $scope.determineArrowSwitchClass = function () {
        if ($scope.isArrowModeOn === true) {
            return 'ion-edit';
        } else if ($scope.isArrowModeOn === false) {
            return 'ion-arrow-swap';
        }
    };

    $scope.determineMuteButtonClass = function () {
        if ($scope.isOwnStreamMuted === true) {
            return 'ion-android-microphone-off';
        } else if ($scope.isOwnStreamMuted === false) {
            return 'ion-android-microphone';
        }
    };

    $scope.toggleArrowMode = function () {
        $scope.isArrowModeOn = !$scope.isArrowModeOn;
        drawingFactory.toggleArrowDrawingMode();
    };

    $scope.toggleMute = function () {
        peerFactory.sendDataToPeer({ type: 'toggleVideoMute' });
        peerFactory.toggleAudioStream();
        $scope.isOwnStreamMuted = !$scope.isOwnStreamMuted;
    };

    $scope.togglePause = function () {
        var payload = {};

        $scope.isOwnVideoPaused = !$scope.isOwnVideoPaused;
        if ($scope.isOwnVideoPaused === true) {
            payload.screen = getVideoScreen($scope.currentLocalVideoLocation).uri;
        }

        peerFactory.sendDataToPeer({ type: 'toggleRemoteVideo', data: payload });
        toggleLocalVideoPlayingState(payload);
    };

    $scope.determineFullscreenCanvas = function () {
        return $scope.currentBigScreen;
    };

    $scope.clearActiveCanvas = function () {
        if ($scope.currentBigScreen === 'remote-big') {
            drawingFactory.clearRemoteCanvas();
        } else if ($scope.currentBigScreen === 'local-big') {
            drawingFactory.clearLocalCanvas();
        }
    };

    $scope.smallStreamSrc = localStreamSrc;
    $scope.bigStreamSrc   = remoteStreamSrc;
    $scope.remoteAudioSrc = remoteStreamSrc;

    $scope.leave = leave;

    if (saveCalls) {
        recordingFactory.startRecording();
    }

    $scope.$on('$ionicView.leave', function () {
        leave();
    });
});

