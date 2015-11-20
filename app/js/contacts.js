'use strict';

var contacts = angular.module('contacts', ['ngCordova'])
.controller('ContactsCtrl', function($scope, contactsFactory) {
        contactsFactory.getAllContacts().then(function (results) {
            $scope.contacts = results;
        }).catch(function(err) {
            console.log(err);
        });
});


contacts.factory('contactsFactory', function($cordovaContacts) {
    return {
        getAllContacts: function() {
            return $cordovaContacts.find({
                fields: ['id', 'displayName', 'name', 'phoneNumbers', 'emails', 'photos']})
                .then(function (allContacts) {
                    console.log(JSON.stringify(allContacts));
                    return allContacts.map(function(c) {
                        return {
                            "displayName": c.displayName || c.emails[0].value,
                            "number":      c.phoneNumbers ? c.phoneNumbers[0] : 'N/A',
                            "photo":       c.photos       ? c.photos[0].value : 'res/img/logo.png'
                        }
                    })
                })
                .catch(function(err) {
                    return err;
            })
        }
    };
});
