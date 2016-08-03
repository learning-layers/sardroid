'use strict';

/*
 * Controller which handles the actual video call part of the app
 * Sets up the canvases, and sets up the correct data callbacks and such...
 */

angular.module('call', [])
.controller('CallCtrl', function ($scope, trackingFactory, recordingFactory,
                                  fileFactory, $ionicLoading, settingsFactory,
                                  $window, $document, callLogFactory,
                                  $sce, $stateParams, peerFactory,
                                  drawingFactory, $interval, $timeout) {
    var saveCalls = settingsFactory.getSetting('saveCalls');

    var startDate = Date.now();

    var alreadyLeaving = false;

    var leave = function () {
        if (alreadyLeaving === false) {
            alreadyLeaving = true;

            $timeout.cancel(screenshotTimeout);
            $interval.cancel(callTimerInterval);
            peerFactory.sendDataToPeer({ type: 'otherPeerLeft' });
            callLogFactory.callSucceeded();
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
                });
            } else {
                peerFactory.endCurrentCall();
            }

        }
    };

    var toggleVideoPlayingState = function (videoSelector) {
        var video = $document[0].querySelector(videoSelector);

        if (video.paused === true) {
            video.play();
        } else {
            video.pause();
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

    var toggleRemoteVideoPlayingState = function () {
        toggleVideoPlayingState($scope.currentRemoteVideoLocation);
    };

    var toggleLocalVideoPlayingState = function () {
        toggleVideoPlayingState($scope.currentLocalVideoLocation);
    };

    var draggableVideo = new Draggabilly('#small-video', { containment: true });

    var localStreamSrc  = $sce.trustAsResourceUrl(peerFactory.getLocalStreamSrc());
    var remoteStreamSrc = $sce.trustAsResourceUrl(peerFactory.getRemoteStreamSrc());

    if (saveCalls) {
        recordingFactory.initializeRecordingVideo(document.getElementById('local-wrapper'));
        // TODO: Re-enable this once CrossWalk gets to chromium 49
        // https://crosswalk-project.org/documentation/downloads.php
        // recordingFactory.initializeRecordingAudio({ source: 'remote', audioStream: peerFactory.getRemoteStream() });
        recordingFactory.initializeRecordingAudio({ source: 'local',  audioStream: peerFactory.getLocalStream() });
    }

    draggableVideo.on('staticClick', function () {
        // TODO: Refactor this into something more elegant
        if ($scope.currentBigScreen === 'remote-big') {
            $scope.currentBigScreen = 'local-big';
            $scope.smallStreamSrc  = remoteStreamSrc;
            $scope.bigStreamSrc    = localStreamSrc;
            $scope.currentRemoteVideoLocation = '#small-video';
            $scope.currentLocalVideoLocation = '#big-video';
        } else if ($scope.currentBigScreen === 'local-big') {
            $scope.currentBigScreen = 'remote-big';
            $scope.smallStreamSrc  = localStreamSrc;
            $scope.bigStreamSrc    = remoteStreamSrc;
            $scope.currentRemoteVideoLocation = '#big-video';
            $scope.currentLocalVideoLocation = '#small-video';
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

    peerFactory.registerCallback('toggleRemoteVideo', function () {
        $window.isRemoteVideoPaused = !$window.isRemoteVideoPaused;
        toggleRemoteVideoPlayingState();
    });

    var screenshotTimeout = null;

    $scope.callPartner = $stateParams.user || { displayName: 'Unknown' };

    var timeSinceCallStarted = 0;
    $scope.callCurrentTime = '00:01';

    var callTimerInterval = $interval(function () {
        timeSinceCallStarted += 1;

        var minutes = Math.floor(timeSinceCallStarted / 60);
        var seconds = timeSinceCallStarted - minutes * 60;

        // Add leading zeroes to counter
        $scope.callCurrentTime = (minutes.toString().length >= 2 ? minutes : '0' + minutes)
                                + ':' + (seconds.toString().length >= 2 ? seconds : '0' + seconds) ;

    }, 1000);

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

    $scope.determineIfPauseButtonDisabled = function () {
        if ($scope.currentRemoteVideoLocation === '#big-video') {
            return true;
        } else if ($scope.currentRemoteVideoLocation === '#small-video') {
            return false;
        }
    };

    $scope.determineArrowSwitchClass = function () {
        if ($scope.isArrowModeOn === true) {
            return 'ion-arrow-swap';
        } else if ($scope.isArrowModeOn === false) {
            return 'ion-edit';
        }
    };

    $scope.determineMuteButtonClass = function () {
        if ($scope.isOwnStreamMuted === true) {
            return 'ion-android-microphone-off';
        } else if ($scope.isOwnStreamMuted === false) {
            return 'ion-android-microphone';
        }
    };

    $scope.determineIfBigVideoIsAutoplay = function () {
        if (($scope.isOwnVideoPaused === true && $scope.currentLocalVideoLocation === '#big-video')
           || ($window.isRemoteVideoPaused === true && $scope.currentRemoteVideoLocation === '#big-video')) {
            return false;
        }

        return true;
    };

    $scope.determineIfSmallVideoIsAutoplay = function () {
        if (($scope.isOwnVideoPaused === true && $scope.currentLocalVideoLocation === '#small-video')
           || ($window.isRemoteVideoPaused === true && $scope.currentRemoteVideoLocation === '#small-video')) {
            return false;
        }

        return true;
    };

    $scope.takeScreenshot = function () {
        document.querySelector('#local-wrapper').classList.add('screenshot');

        recordingFactory.screenshotElement(document.getElementById('local-wrapper'))
        .then(function (canvas) {
            document.querySelector('#local-wrapper').classList.remove('screenshot');
            var pngBlob = fileFactory.base64ToBlob(canvas.toDataURL('image/png'));

            fileFactory.writeToFile({data: pngBlob, fileName: recordingFactory.getCurrentScreenshotFilename() })
            .then(function (res) {
                console.log('alright!!!');
            })
            .catch(function (e) {
                console.log(e);
            });
        });
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

    $scope.togglePause = function ($event) {
        if ($event.currentTarget.getAttribute('disabled') !== null) { return; }
        $scope.isOwnVideoPaused = !$scope.isOwnVideoPaused;
        peerFactory.sendDataToPeer({ type: 'toggleRemoteVideo' });
        toggleLocalVideoPlayingState();
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

