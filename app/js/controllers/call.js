'use strict';

/*
 * Controller which handles the actual video call part of the app
 * Sets up the canvases, and sets up the correct data callbacks and such...
 */

angular.module('call', [])

.controller('CallCtrl', function($scope, $sce, $stateParams, peerFactory, drawingFactory) {

            if ($stateParams && $stateParams.user) {
                    $scope.user = $stateParams.user;
            } else {
                    $scope.user = { displayName: '?????'};
            }

            var localWrapper  = document.querySelector('#local-wrapper');
            var remoteWrapper = document.querySelector('#remote-wrapper');


            //TODO: Refactor this into something more elegant
            $scope.toggleFullscreen = function (canvasId) {

                if ($scope.currentFullscreenCanvas === canvasId) {

                    $scope.currentFullscreenCanvas = null;
                    drawingFactory.zoomOutCanvasByTag(canvasId);

                    switch (canvasId) {
                        case 'local':
                            localWrapper.classList.remove('fullscreen');
                            remoteWrapper.style.display = '';
                        break;
                        case 'remote':
                            remoteWrapper.classList.remove('fullscreen');
                            localWrapper.style.display = '';
                        break;
                    }

                } else {

                    drawingFactory.zoomInCanvasByTag(canvasId);
                    $scope.currentFullscreenCanvas = canvasId;

                    switch (canvasId) {
                        case 'local':
                           localWrapper.classList.add('fullscreen');
                            remoteWrapper.style.display = 'none';
                        break;
                        case 'remote':
                            remoteWrapper.classList.add('fullscreen');
                            localWrapper.style.display = 'none';
                        break;
                    }
                }

            }

            $scope.determineFullscreenButtonClass = function () {
                if ($scope.currentFullscreenCanvas) {
                    return 'ion-arrow-shrink'
                } else {
                    return 'ion-arrow-expand'
                }
            }

            var leave = function () {
                peerFactory.sendDataToPeer({ type: 'otherPeerLeft' });
                drawingFactory.tearDownDrawingFactory();
                peerFactory.clearCallback('otherPeerLeft');
                peerFactory.endCurrentCall();
            }

            $scope.leave = leave;

            var localStreamSrc = peerFactory.getLocalStreamSrc();
            var remoteStreamSrc = peerFactory.getRemoteStreamSrc();

            // Sweet hack for browser if you can't be bothered to make a call
            if (localStreamSrc === null) { localStreamSrc = 'res/img/SampleVideo_1080x720_10mb.mp4' }
            if (remoteStreamSrc === null) { remoteStreamSrc = 'res/img/SampleVideo_1080x720_10mb.mp4' }

            var localCanvas = document.querySelector('#local-canvas');
            var remoteCanvas = document.querySelector('#remote-canvas');

            $scope.localStreamSrc  = $sce.trustAsResourceUrl(localStreamSrc);
            $scope.remoteStreamSrc = $sce.trustAsResourceUrl(remoteStreamSrc);

            drawingFactory.setUpDataCallbacks();
            drawingFactory.setUpRemoteCanvas(remoteCanvas,{});
            drawingFactory.setUpLocalCanvas(localCanvas, {});

            peerFactory.registerCallback('otherPeerLeft', function (data) {
                leave();
            });

            $scope.$on('$ionicView.leave', function(event) {
                leave();
            });
});

