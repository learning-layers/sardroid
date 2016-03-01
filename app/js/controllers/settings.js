'use strict';

/*
 * Module that contains a controller in charge of user settings
 */

angular.module('settings', [])

.controller('SettingsCtrl', function($scope, $ionicHistory, $ionicLoading, $translate,  contactsFactory) {

    $scope.updateContactsList = function () {
        $ionicLoading.show({template: $translate.instant('SYNCING_CONTACTS')});
        return contactsFactory.syncContactsWithServer()
            .then(function () {
                $ionicLoading.hide();
                $ionicHistory.goBack();
            })
    }
});

