'use strict';



angular.module('call', ['peerhandler', 'drawinghandler'])

.controller('CallCtrl', function($scope, $sce, $stateParams, peerFactory, drawingFactory) {
            if ($stateParams && $stateParams.user) {
                    $scope.user = $stateParams.user;
            } else {
                    $scope.user = {};
            }
            //var localStreamSrc = peerFactory.getLocalStreamSrc();
            //var remoteStreamSrc = peerFactory.getRemoteStreamSrc();
            var localCanvas = document.querySelector('#local-canvas');
            var remoteCanvas = document.querySelector('#remote-canvas');           
            var localStreamSrc = 'res/img/SampleVideo_1080x720_10mb.mp4';
            var remoteStreamSrc = 'res/img/SampleVideo_1080x720_10mb.mp4';
            $scope.localStreamSrc  = $sce.trustAsResourceUrl(localStreamSrc);
            $scope.remoteStreamSrc = $sce.trustAsResourceUrl(remoteStreamSrc);

            drawingFactory.setUpRemoteCanvas(remoteCanvas, function(){},{});
            drawingFactory.setUpLocalCanvas(localCanvas, function(){}, {});
            $scope.$on('$ionicView.leave', function() {
                 peerFactory.endCurrentCall();
            });
});
