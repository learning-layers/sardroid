'use strict';



angular.module('call', ['peerhandler'])

.controller('CallCtrl', function($scope, $sce, $stateParams, peerFactory) {
            if ($stateParams && $stateParams.user) {
                    $scope.user = $stateParams.user;
            } else {
                    $scope.user = {};
            }
            var localStreamSrc = peerFactory.getLocalStreamSrc();
            var remoteStreamSrc = peerFactory.getRemoteStreamSrc();

            $scope.localStreamSrc  = $sce.trustAsResourceUrl(localStreamSrc);
            $scope.remoteStreamSrc = $sce.trustAsResourceUrl(remoteStreamSrc);

            $scope.$on('$ionicView.leave', function() {
                    peerFactory.endCurrentCall();
            });
});
