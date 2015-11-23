'use strict';

var contacts = angular.module('contacts', ['ngCordova', 'peerhandler'])
.controller('ContactsCtrl', function($scope, contactsFactory, peerFactory, $state, $ionicActionSheet) {

        contactsFactory.getAllContacts().then(function (results) {
            $scope.contacts = results;
        }).catch(function(err) {
            console.log(err);
        });


        $scope.searchKeyPress = function(keyCode) {
            // Enter and Android keyboard 'GO' KEYCODES
            if ((keyCode === 66 || keyCode === 13) && typeof cordova !== 'undefined') {
                cordova.plugins.Keyboard.close();
            }
        };

        $scope.selectUser = function(selectedUser) {
            var sheet = $ionicActionSheet.show({
                buttons: [
                    { text: '<i class="icon ion-ios-telephone"></i> <b>Call</b>' },
                    { text: '<i class="icon ion-android-person"></i> Profile' },
                ],
                titleText:  'Actions',
                cancelText: 'Cancel',
                cancel: function() {
                    sheet();
                },
                buttonClicked: function(index) {
                    switch (index) {
                        case 0:
                            peerFactory.callPeer(selectedUser);
                            break;
                        case 1:
                            $state.go('userprofile', { user: selectedUser });
                            break;
                    }

                    return true;
                }
            });
        };
});

contacts.factory('contactsFactory', function($cordovaContacts) {
    return {
        getAllContacts: function() {
                return $cordovaContacts.find({
                    fields: ['id', 'displayName', 'name', 'phoneNumbers', 'emails', 'photos']
                })
                .then(function (allContacts) {
                        return allContacts.map(function (c) {
                           return {
                                "original": c,
                                "displayName": c.displayName || c.emails[0].value,
                                "number": c.phoneNumbers ? c.phoneNumbers[0] ? c.phoneNumbers[0].value : 'N/A' : 'N/A',
                                "photo": c.photos ? c.photos[0] ? c.photos[0].value : 'res/img/logo.png' : 'res/img/logo.png'
                         }
                      })
                  })
                .catch(function (err) {
                  return err;
                });
        }
    };
});
