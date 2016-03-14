'use strict';

/*
 * Controller which handles the actual video call part of the app
 * Sets up the canvases, and sets up the correct data callbacks and such...
 */

angular.module('call', [])
.controller('CallCtrl', function ($scope, $document, $sce, $stateParams, peerFactory, drawingFactory) {
    var localWrapper  = $document[0].querySelector('#local-wrapper');
    var remoteWrapper = $document[0].querySelector('#remote-wrapper');

    var leave = function () {
        peerFactory.sendDataToPeer({ type: 'otherPeerLeft' });
        drawingFactory.tearDownDrawingFactory();
        peerFactory.clearCallback('otherPeerLeft');
        peerFactory.endCurrentCall();
    };

    var localStreamSrc  = $sce.trustAsResourceUrl(peerFactory.getLocalStreamSrc());
    var remoteStreamSrc = $sce.trustAsResourceUrl(peerFactory.getRemoteStreamSrc())

    var localCanvas =  $document[0].querySelector('#local-canvas');
    var remoteCanvas = $document[0].querySelector('#remote-canvas');

    // Sweet hack for browser if you can't be bothered to make a call
    if (localStreamSrc === null) { localStreamSrc = 'res/img/SampleVideo_1080x720_10mb.mp4'; }
    if (remoteStreamSrc === null) { remoteStreamSrc = 'res/img/SampleVideo_1080x720_10mb.mp4'; }

    drawingFactory.setUpDataCallbacks();
    drawingFactory.setUpRemoteCanvas(remoteCanvas, {});
    drawingFactory.setUpLocalCanvas(localCanvas, {});

    peerFactory.registerCallback('otherPeerLeft', function () {
        leave();
    });

    if ($stateParams && $stateParams.user) {
        $scope.user = $stateParams.user;
    } else {
        $scope.user = { displayName: '?????' };
    }

    $scope.currentBigScreen = 'remote-big';

    $scope.leave = leave;

    $scope.determineFullscreenButtonClass = function () {
        if ($scope.currentFullscreenCanvas) {
            return 'ion-arrow-shrink';
        }
        return 'ion-arrow-expand';
    };

    $scope.determineFullscreenCanvas = function () {
        return $scope.currentBigScreen;
    };

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

