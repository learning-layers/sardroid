'use strict';

/*
 * Pretty simple controller for the login screen.
 * Not much else to say about this one!
 */

angular.module('login', ['peerhandler'])

.controller('LoginCtrl', function($scope, $state, $localStorage, $ionicHistory, $http, peerFactory, socketFactory, configFactory) {
        // Disable back button so we can't back to login!
        $ionicHistory.nextViewOptions({
            disableBack: true
        });

        var url = configFactory.getValue('apiUrl');

        // Hack so we're disconnected for sure!
        peerFactory.disconnectFromPeerJS();

        if ($localStorage.user) {
            $scope.user = $localStorage.user;
        }

        $scope.goToSignUp = function () {
            $state.go('verify');
        }

        $scope.login = function(user) {
            if (typeof user !== 'undefined' && user.phoneNumber && user.password) {

                $http.post(
                    url + 'auth/login',
                    { phoneNumber : user.phoneNumber,
                     password     : user.password }
                ).then(function success(results) {

                    $localStorage.user  = results.data.user;
                    $localStorage.token = results.data.user.token;
 
                    peerFactory.connectToPeerJS(user.phoneNumber).then(function() {
                        return socketFactory.connectToServer($localStorage.token);
                    }).then(function () {
                        $state.go('tabs.contacts');
                    })
                    .catch(function (error) {
                        peerFactory.disconnectFromPeerJS();
                        socketFactory.disconnectFromServer();
                    });

                }, function error(err) {
                    console.log(err);
                })
            }
        };
});

