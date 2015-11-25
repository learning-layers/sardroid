'use strict';

angular.module('logout', ['peerhandler'])

    .controller('LogoutCtrl', function($scope, $state, peerFactory) {
        $scope.logout = function() {
            if (peerFactory.isConnected()) {
                peerFactory.disconnectFromPeerJS();
            }
             $state.go('login');
        };
});