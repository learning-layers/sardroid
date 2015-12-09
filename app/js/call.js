'use strict';

/*
 * Controller which handles the actual video call part of the app
 * Sets up the canvases, and sets up the correct data callbacks and such...
 */

angular.module('call', ['peerhandler', 'drawinghandler'])

.controller('CallCtrl', function($scope, $sce, $stateParams, peerFactory, drawingFactory) {
            if ($stateParams && $stateParams.user) {
                    $scope.user = $stateParams.user;
            } else {
                    $scope.user = {};
            }

            var localStreamSrc = peerFactory.getLocalStreamSrc();
            var remoteStreamSrc = peerFactory.getRemoteStreamSrc();

            // Sweet hack for browser if you can't be bothered to make a call
            if (localStreamSrc === null) {localStreamSrc = 'res/img/SampleVideo_1080x720_10mb.mp4'}
            if (remoteStreamSrc === null) {remoteStreamSrc = 'res/img/SampleVideo_1080x720_10mb.mp4'}

            var localCanvas = document.querySelector('#local-canvas');
            var remoteCanvas = document.querySelector('#remote-canvas');

            $scope.localStreamSrc  = $sce.trustAsResourceUrl(localStreamSrc);
            $scope.remoteStreamSrc = $sce.trustAsResourceUrl(remoteStreamSrc);

            drawingFactory.setUpDataCallbacks();
            drawingFactory.setUpRemoteCanvas(remoteCanvas,{});
            drawingFactory.setUpLocalCanvas(localCanvas, {});

            $scope.$on('$ionicView.leave', function() {
                drawingFactory.tearDownDrawingFactory();
                peerFactory.endCurrentCall();
            });
});

