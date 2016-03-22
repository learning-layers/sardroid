'use strict';

/*
 * Module that contains a controller in charge of user settings
 */

angular.module('settings', [])
.controller('SettingsCtrl', function ($scope, $window, $ionicHistory, $ionicLoading, $translate, settingsFactory, contactsFactory) {
    $scope.settings = settingsFactory.getAllSettings();
    $scope.appVersion = $window.env.version;

    $scope.updateContactsList = function () {
        $ionicLoading.show({ template: $translate.instant('SYNCING_CONTACTS') });

        return contactsFactory.syncContactsWithServer()
            .then(function () {
                $ionicLoading.hide();
                $ionicHistory.goBack();
            });
    };

    $scope.toggleVideoSave = function (videoSaveState) {
        settingsFactory.setSettings({ saveCalls: videoSaveState });
    };
});

