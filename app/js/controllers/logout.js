'use strict';

/*
 * Controller for the logout button on the tab bar and side-menu
 * Basically, it closes the PeerJS connection and retuns you to
 * the login screen
 */

angular.module('logout', [])
.controller('LogoutCtrl', function ($scope, $log, $state, $localStorage,  peerFactory, socketFactory, apiFactory) {
    $scope.logout = function () {
        apiFactory.auth.logout()
        .then(function (results) {
            $log.log(results);
        })
        .catch(function (error) {
            $log.log(error);
        });

        apiFactory.deleteApiToken();

        delete $localStorage.user;
        delete $localStorage.token;

        if (peerFactory.isConnected()) {
            peerFactory.disconnectFromPeerJS();
        }

        socketFactory.disconnectFromServer();

        $state.go('login');
    };
});

