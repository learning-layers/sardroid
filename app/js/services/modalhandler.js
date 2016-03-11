'use strict';

/*
 * Simple wrapper around $ionicPopup for modals and alerts and such
 */

angular.module('modalhandler', [])
.factory('modalFactory', function ($ionicPopup) {

    // Keep tabs on currently active pop ups.
    // Mostly so we don't spam them too often.

    var currentPopups = [];

    var pruneUsedPopupsByType = function (type) {

        return _.reject(currentPopups, function (p) {

            return p.type === type;

        });

    };

    var getPopupsByType = function (type) {

        return _.where(currentPopups, { type: type });

    };

    return {
        closeAllPopups: function () {

            currentPopups.forEach(function (p) {

                p.popupRef.close();

            });

            currentPopups = [];

        },
        alert: function (title, template) {

            return new Promise(function (resolve) {

                var alertPopup;

                if (getPopupsByType(title).length === 0) {

                    alertPopup = $ionicPopup.alert({
                        title    : title,
                        template : template
                    });

                    currentPopups.push({ type: title, popupRef: alertPopup });

                    alertPopup.then(function () {

                        currentPopups = pruneUsedPopupsByType(title);
                        resolve();

                    });

                } else {

                    // Same kind of popup is already visible, just resolve without spamming
                    resolve();

                }

            });

        },

        confirm: function (title, template) {

            return new Promise(function (resolve) {

                var confirmPopup;

                if (getPopupsByType(title).length === 0) {

                    confirmPopup = $ionicPopup.confirm({
                        title    : title,
                        template : template
                    });

                    currentPopups.push({ type: title, popupRef: confirmPopup });

                    confirmPopup.then(function (res) {

                        currentPopups = pruneUsedPopupsByType(title);
                        resolve(res);

                    });

                } else {

                    // Same kind of popup is already visible, just resolve without spamming
                    resolve();

                }

            });

        }

    };

});

