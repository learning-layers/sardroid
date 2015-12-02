'use strict';



angular.module('call', ['peerhandler', 'drawinghandler'])

.controller('CallCtrl', function($scope, $sce, $stateParams, peerFactory, drawingFactory) {
            if ($stateParams && $stateParams.user) {
                    $scope.user = $stateParams.user;
            } else {
                    $scope.user = {};
            }
            var localStreamSrc = peerFactory.getLocalStreamSrc();
            var remoteStreamSrc = peerFactory.getRemoteStreamSrc();

            if (localStreamSrc === null) {localStreamSrc = 'res/img/SampleVideo_1080x720_10mb.mp4'}
            if (remoteStreamSrc === null) {remoteStreamSrc = 'res/img/SampleVideo_1080x720_10mb.mp4'}
            
            var localCanvas = document.querySelector('#local-canvas');
            var remoteCanvas = document.querySelector('#remote-canvas');           
            
            $scope.localStreamSrc  = $sce.trustAsResourceUrl(localStreamSrc);
            $scope.remoteStreamSrc = $sce.trustAsResourceUrl(remoteStreamSrc);

            drawingFactory.setUpRemoteCanvas(remoteCanvas,{});
            drawingFactory.setUpLocalCanvas(localCanvas, {});

            $scope.$on('$ionicView.leave', function() {
                 peerFactory.endCurrentCall();
            });
});
