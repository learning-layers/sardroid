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
        console.log('pruning used popups, old array: ', currentPopups);
        currentPopups = _.reject(currentPopups, function (p) { return p.type === type; });
        console.log('pruning used popups, new array: ', currentPopups);
    };

    return {
        alert: function (title, template) {

            return new Promise(function (resolve, reject) {
                var alertPopup = $ionicPopup.alert({
                    title    : title,
                    template : template
                });

                currentPopups.push({type: title, popupRef: alertPopup});

                alertPopup.then(function () {
                    pruneUsedPopupsByType(title)
                    resolve();
                })
            })
        }
    }
});

