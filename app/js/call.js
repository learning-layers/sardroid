'use strict';

angular.module('call', ['peerhandler'])

.controller('CallCtrl', ['$sce', function($scope, $stateParams, $sce, peerFactory) {
        if ($stateParams && $stateParams.user) {
                $scope.user = $stateParams.user;
        } else {
                $scope.user = {};
        }

        $scope.localStreamSrc  = $sce.trustAsResourceUrl(peerFactory.getLocalStreamSrc());
        $scope.remoteStreamSrc = $sce.trustAsResourceUrl(peerFactory.getRemoteStreamSrc());
}]);
