'use strict';

/*
 * Module that contains a controller in charge of user settings
 */

angular.module('settings', [])
.controller('SettingsCtrl', function ($scope, $window, $translate, $ionicHistory, $ionicLoading, fileFactory, modalFactory, settingsFactory, contactsFactory) {
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

    $scope.emptyCallDataDir = function () {
        fileFactory.emptyCallDataDir()
            .then(function () {
                modalFactory.alert($translate.instant('SUCCESS'), $translate.instant('CALLDATA_DELETED'));
            })
            .catch(function (err) {
                console.log(err);
                modalFactory.alert($translate.instant('ERROR_TITLE'), err.message);
            })
    }
});

