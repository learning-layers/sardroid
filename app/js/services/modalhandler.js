'use strict';

/*
 * Simple wrapper around $ionicPopup for modals and alerts and such
 */

var modalhandler = angular.module('modalhandler', []);

modalhandler.factory('modalFactory', function($ionicPopup) {
    // Keep tabs on currently active pop ups.
    // Mostly so we don't spam them too often.

    var currentPopups = [];

    var pruneUsedPopupsByType = function (type) {
        return _.reject(currentPopups, function (p) { return p.type === type; });
    };

    var getPopupsByType = function (type) {
        return _.where(currentPopups, { type: type });
    };

    return {
        closeAllPopups: function () {
            currentPopups.map(function (p) {
                p.popupRef.close();
            });

            currentPopups = [];
        },
        alert: function (title, template) {
            return new Promise(function (resolve, reject) {
                if (getPopupsByType(title).length === 0) {
                    var alertPopup = $ionicPopup.alert({
                        title    : title,
                        template : template
                    });
                    currentPopups.push({type: title, popupRef: alertPopup});

                    alertPopup.then(function () {
                        currentPopups = pruneUsedPopupsByType(title)
                        resolve();
                    })
                } else {
                    // Same kind of popup is already visible, just resolve without spamming
                    resolve();
                }
            })
        },

        confirm: function (title, template) {
            return new Promise(function (resolve, reject) {
                if (getPopupsByType(title).length === 0) {

                    var confirmPopup = $ionicPopup.confirm({
                        title    : title,
                        template : template
                    });

                    currentPopups.push({type: title, popupRef: confirmPopup});

                    confirmPopup.then(function (res) {
                        console.log(res);
                        currentPopups = pruneUsedPopupsByType(title)
                        resolve(res);
                    })

                } else {
                    // Same kind of popup is already visible, just resolve without spamming
                    resolve();
                }
            })

        }

    }
});

