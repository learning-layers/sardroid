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
        peerFactory.endCurrentCall();
    };

    var toggleVideos = function () {
        var videos = $document[0].querySelectorAll('video');
        var len = videos.length;
        var i;

        for (i = 0; i < len; i++) {
            if (videos[i].paused) {
                videos[i].play();
            } else {
                videos[i].pause();
            }
        }
    }

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

    peerFactory.registerCallback('toggleVideos', function (data) {
        $scope.isOwnStreamPaused = !$scope.isOwnStreamPaused;
        toggleVideos();
    });

    if ($stateParams && $stateParams.user) {
        $scope.user = $stateParams.user;
    } else {
        $scope.user = { displayName: '?????' };
    }


    $scope.currentBigScreen = 'remote-big';

    $scope.leave = leave;

    $scope.isOwnStreamPaused = false;
    $scope.isOwnStreamMuted  = false;

    $scope.determinePauseButtonClass = function () {
        if ($scope.isOwnStreamPaused === true) {
            return 'ion-play';
        } else if ($scope.isOwnStreamPaused === false) {
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
        peerFactory.toggleAudioStream();
        $scope.isOwnStreamMuted = !$scope.isOwnStreamMuted;
    };

    $scope.togglePause = function () {
        peerFactory.sendDataToPeer({ type: 'toggleVideos' });
        toggleVideos();
        $scope.isOwnStreamPaused = !$scope.isOwnStreamPaused;
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

    // TODO: Refactor this into something more elegant
    $scope.toggleFullscreen = function () {
        if ($scope.currentBigScreen === 'remote-big') {
            $scope.currentBigScreen = 'local-big';
            $scope.smallStreamSrc  = remoteStreamSrc;
            $scope.bigStreamSrc    = localStreamSrc;
        } else if ($scope.currentBigScreen === 'local-big') {
            $scope.currentBigScreen = 'remote-big';
            $scope.smallStreamSrc  = localStreamSrc;
            $scope.bigStreamSrc    = remoteStreamSrc;
        }
    };

    $scope.$on('$ionicView.leave', function () {
        leave();
    });
});

