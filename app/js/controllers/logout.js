'use strict';
/*
 * Controller for the logout button on the tab bar and side-menu
 * Basically, it closes the PeerJS connection and retuns you to
 * the login screen
 */

angular.module('logout', [])

    .controller('LogoutCtrl', function($scope, $state, $localStorage,  peerFactory, socketFactory, apiFactory) {
        $scope.logout = function() {

            apiFactory.auth.logout()
                .then(function (results) {
                    console.log(results);
                })
                .catch(function (error) {
                    console.log(error);
                })

                apiFactory.deleteApiToken();

                var number             = $localStorage.user.phoneNumber;
                var contactsBeenSynced = $localStorage.contactsBeenSynced;

                // Remove everything about user except user number so it doesn't have to be typed in every time
                $localStorage.$reset({
                        user: {
                            phoneNumber: number
                        },
                        contactsBeenSynced: contactsBeenSynced,
                        hasBeenInRegister:  true
                });

                if (peerFactory.isConnected()) {
                    peerFactory.disconnectFromPeerJS();
                }

                socketFactory.disconnectFromServer();

                $state.go('login');
        };
});

