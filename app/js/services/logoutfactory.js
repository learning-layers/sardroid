'use strict';

/*
 * Module for playing audio, now the Angular way!
 */

angular.module('logout')
.factory('logoutFactory', function (apiFactory, trackingFactory, notificationFactory,
                                    $localStorage, peerFactory, socketFactory,
                                   $state) {
    var finishLogout = function () {
        apiFactory.deleteApiToken();
        trackingFactory.track.auth.logout();
        notificationFactory.removeCurrentDeviceToken();

        delete $localStorage.user;
        delete $localStorage.token;

        if (peerFactory.isConnected()) {
            peerFactory.disconnectFromPeerJS();
        }

        socketFactory.disconnectFromServer();
        $state.go('login');
    };

    return {
        logOut: function () {
            var currentDeviceToken = notificationFactory.getCurrentDeviceToken();

            apiFactory.auth.logout(currentDeviceToken)
            .then(finishLogout)
            .catch(finishLogout);
        }
    };
});

