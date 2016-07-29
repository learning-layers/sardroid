'use strict';

/*
 * Controller for the logout button on the tab bar and side-menu
 * Basically, it closes the PeerJS connection and retuns you to
 * the login screen.
 */

angular.module('logout', [])
.controller('LogoutCtrl', function ($scope, logoutFactory) {
    $scope.logout = function () {
        logoutFactory.logOut();
    };
});

