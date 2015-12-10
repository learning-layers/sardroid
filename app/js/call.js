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
                    $scope.user = { displayName: '?????'};
            }

            $scope.toggleFullscreen = function (canvasId) {
                console.log(canvasId);

                if ($scope.currentFullscreenCanvas === canvasId) {
                    $scope.currentFullscreenCanvas = null;
                    console.log('going away from fullscreen ' + canvasId)
                    switch (canvasId) {
                        case 'local':
                            document.querySelector('#local-wrapper').classList.remove('fullscreen');
                            document.querySelector('#remote-wrapper').style.display = '';
                        break;
                        case 'remote':
                            document.querySelector('#remote-wrapper').classList.remove('fullscreen');
                            document.querySelector('#local-wrapper').style.display = '';
                        break;
                    }
                } else {
                    console.log('zooming into canvas ' + canvasId);
                    $scope.currentFullscreenCanvas = canvasId;

                    switch (canvasId) {
                        case 'local':
                            document.querySelector('#local-wrapper').classList.add('fullscreen');
                            document.querySelector('#remote-wrapper').style.display = 'none';
                        break;
                        case 'remote':
                            document.querySelector('#remote-wrapper').classList.add('fullscreen');
                            document.querySelector('#local-wrapper').style.display = 'none';
                        break;
                    }
                }

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

