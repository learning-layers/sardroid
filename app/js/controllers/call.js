'use strict';

/*
 * Controller which handles the actual video call part of the app
 * Sets up the canvases, and sets up the correct data callbacks and such...
 */

angular.module('call', [])
.controller('CallCtrl', function ($scope, $document, $sce, $stateParams, peerFactory, drawingFactory) {

    var leave = function () {
        peerFactory.sendDataToPeer({ type: 'otherPeerLeft' });
        drawingFactory.tearDownDrawingFactory();
        peerFactory.clearCallback('otherPeerLeft');
        peerFactory.clearCallback('toggleVideos');
        peerFactory.clearCallback('toggleVideoMute');
        peerFactory.endCurrentCall();
    };

    var setVideoPlayingState = function (isPlaying) {
        var videos = $document[0].querySelectorAll('video');
        var len = videos.length;
        var i;

        for (i = 0; i < len; i++) {
            if (isPlaying === true) {
                videos[i].play();
            } else if (isPlaying === false) {
                videos[i].pause();
            }
        }
    }

    var draggableVideo = new Draggabilly('#small-video', {});

    draggableVideo.on('staticClick', function () {
        // TODO: Refactor this into something more elegant
            if ($scope.currentBigScreen === 'remote-big') {
                $scope.currentBigScreen = 'local-big';
                $scope.smallStreamSrc  = remoteStreamSrc;
                $scope.bigStreamSrc    = localStreamSrc;
            } else if ($scope.currentBigScreen === 'local-big') {
                $scope.currentBigScreen = 'remote-big';
                $scope.smallStreamSrc  = localStreamSrc;
                $scope.bigStreamSrc    = remoteStreamSrc;
        };
        $scope.$apply();
    })
    var callAudio = $document[0].querySelector('#call-audio');
    var localStreamSrc  = $sce.trustAsResourceUrl(peerFactory.getLocalStreamSrc());
    var remoteStreamSrc = $sce.trustAsResourceUrl(peerFactory.getRemoteStreamSrc())

    // Sweet hack for browser if you can't be bothered to make a call
    if (localStreamSrc === null) { localStreamSrc = 'res/img/SampleVideo_1080x720_10mb.mp4'; }
    if (remoteStreamSrc === null) { remoteStreamSrc = 'res/img/SampleVideo_1080x720_10mb.mp4'; }

    drawingFactory.setUpDataCallbacks();
    drawingFactory.setUpRemoteCanvas('remote-canvas', {});
    drawingFactory.setUpLocalCanvas('local-canvas', {});


    peerFactory.registerCallback('otherPeerLeft', function () {
        leave();
    });

    peerFactory.registerCallback('toggleVideoMute', function () {
        if (callAudio.paused) {
            callAudio.play();
        } else {
            callAudio.pause();
        }
    });

    peerFactory.registerCallback('toggleVideos', function (data) {
        $scope.isStreamPlaying = data.isPlaying;
        setVideoPlayingState(data.isPlaying);
        console.log($scope.isStreamPlaying);
    });

    if ($stateParams && $stateParams.user) {
        $scope.user = $stateParams.user;
    } else {
        $scope.user = { displayName: '?????' };
    }

    $scope.remoteAudioSrc = remoteStreamSrc;

    $scope.currentBigScreen = 'remote-big';

    $scope.leave = leave;

    $scope.isStreamPlaying = true;
    $scope.isOwnStreamMuted  = false;

    $scope.determinePauseButtonClass = function () {
        if ($scope.isStreamPlaying === false) {
            return 'ion-play';
        } else if ($scope.isStreamPlaying === true) {
            return 'ion-pause';
        }
    };

    $scope.determineMuteButtonClass = function () {
        if ($scope.isOwnStreamMuted === true) {
            return 'ion-android-microphone-off';
        } else if ($scope.isOwnStreamMuted === false) {
            return 'ion-android-microphone';
        }
    };

    $scope.toggleMute = function () {
        peerFactory.sendDataToPeer({ type: 'toggleVideoMute' });
        peerFactory.toggleAudioStream();
        $scope.isOwnStreamMuted = !$scope.isOwnStreamMuted;
    };

    $scope.togglePause = function () {
        $scope.isStreamPlaying = !$scope.isStreamPlaying;
        peerFactory.sendDataToPeer({ type: 'toggleVideos', isPlaying: $scope.isStreamPlaying });
        setVideoPlayingState($scope.isStreamPlaying);
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
    }

    $scope.smallStreamSrc  =  localStreamSrc;
    $scope.bigStreamSrc    =  remoteStreamSrc;


    $scope.$on('$ionicView.leave', function () {
        leave();
    });
});

