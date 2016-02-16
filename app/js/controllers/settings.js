'use strict';

/*
 * Module that contains a controller in charge of user settings
 */

angular.module('settings', [])

.controller('SettingsCtrl', function($scope, $ionicLoading, contactsFactory) {

    $scope.updateContactsList = function () {
        $ionicLoading.show({template: 'Syncing contacts...'});
        return contactsFactory.syncContactsWithServer()
            .then(function () {
                $ionicLoading.hide();
            })
    }
});

