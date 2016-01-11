'use strict';

/*
 * Simple wrapper around $ionicPopup for modals and alerts and such
 */

var modalhandler = angular.module('modalhandler', []);

modalhandler.factory('modalFactory', function(i$ionicPopup) {
    return {
        alert: function (title, template) {
            return $ionicPopup.alert({
                title    : title,
                template : template
            });
        }
    }
});

