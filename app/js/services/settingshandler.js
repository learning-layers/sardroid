'use strict';

/*
 * Module for handling and saving various different user preferences
 */

angular.module('settings')
.factory('settingsFactory', function ($localStorage, configFactory) {
    return {
        setInitialSettingsIfApplicable: function () {
            var initialSettings = configFactory.getValue('initialUserSettings');

            if (!$localStorage.settings) {
                $localStorage.settings = {};
            }

            $localStorage.settings = _.defaults($localStorage.settings, initialSettings);
        },

        setSettings: function (settingOpt) {
            var keys   = _.keys(settingOpt);
            var values = _.values(settingOpt);
            var i = 0;

            for (i = 0; i < values.length; i++) {
                $localStorage.settings[keys[i]] = values[i];
            }
        },

        getSetting: function (settingKey) {
            return $localStorage.settings[settingKey];
        },
        getAllSettings: function () {
            return $localStorage.settings;
        }
    };
});

