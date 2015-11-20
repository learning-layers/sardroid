'use strict';

var contacts = angular.module('contacts', ['ngCordova'])
.controller('ContactsCtrl', function($scope, $cordovaContacts) {

        $scope.getAllContacts = function() {
            $cordovaContacts.find({
                fields: ['id', 'displayName', 'name', 'phoneNumbers', 'emails', 'photos']})
            .then(function (allContacts) {
                console.log(JSON.stringify(allContacts));
                $scope.contacts = allContacts.map(function(c) {
                    return {
                        "displayName": c.displayName || c.emails[0].value,
                        "number":      c.phoneNumbers ? c.phoneNumbers[0] : 'N/A',
                        "photo":       c.photos       ? c.photos[0].value : 'res/img/logo.png'
                    }
                })
            })
            .catch(function(err) {
                console.log(err);
            })
        };

      $scope.getAllContacts();
});
