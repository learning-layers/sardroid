'use strict';

var contacts = angular.module('contacts', ['ngCordova'])
.controller('ContactsCtrl', function($scope, contactsFactory, $state) {
        console.log("asd");
        contactsFactory.getAllContacts().then(function (results) {
            $scope.contacts = results;
        }).catch(function(err) {
            console.log(err);
        });
        $scope.selectUser = function(selectedUser) {
            $state.go('userprofile', { user: selectedUser });
        }
});

contacts.factory('contactsFactory', function($cordovaContacts) {
    return {
        getAllContacts: function() {
            if (typeof cordova !== 'undefined') {
                return $cordovaContacts.find({
                    fields: ['id', 'displayName', 'name', 'phoneNumbers', 'emails', 'photos']
                })
                    .then(function (allContacts) {
                        return allContacts.map(function (c) {
                            return {
                                "original": c,
                                "displayName": c.displayName || c.emails[0].value,
                                "number": c.phoneNumbers ? c.phoneNumbers[0] : 'N/A',
                                "photo": c.photos ? c.photos[0].value : 'res/img/logo.png'
                            }
                        })
                    })
                    .catch(function (err) {
                        return err;
                    })
            } else {
                return new Promise(function(resolve, reject) {
                    resolve( [ {
                        "original": {"displayName": "Durr2"},
                        "displayName": "Durr1",
                        "number": 'N/A',
                        "photo": 'res/img/logo.png'
                    }, {
                        "original": {"displayName": "Durr2"},
                        "displayName": "Durr2",
                        "number": 'N/A',
                        "photo": 'res/img/logo.png'
                    }]);
                })
            }
        }
    };
});
