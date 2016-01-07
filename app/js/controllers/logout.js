'use strict';
/*
 * Controller for the logout button on the tab bar and side-menu
 * Basically, it closes the PeerJS connection and retuns you to
 * the login screen
 */

angular.module('logout', ['peerhandler'])

    .controller('LogoutCtrl', function($scope, $state, peerFactory, socketFactory) {
        $scope.logout = function() {
            if (peerFactory.isConnected()) {
                peerFactory.disconnectFromPeerJS();
            }

            socketFactory.disconnectFromServer();

            $state.go('login');
        };
});
