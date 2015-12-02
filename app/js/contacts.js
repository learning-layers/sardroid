'use strict';

var contacts = angular.module('contacts', ['ngCordova', 'peerhandler'])
.controller('ContactsCtrl', function($scope, $localStorage, contactsFactory, peerFactory, $state, $ionicActionSheet) {

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
        $scope.user = $localStorage.user;
        $scope.selectUser = function(selectedUser) {
            var sheet = $ionicActionSheet.show({
                buttons: [
                    { text: '<i class="icon ion-ios-telephone"></i> <b>Call with SAR</b>' },
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

            var opts = {
                fields: ['id', 'displayName', 'name', 'phoneNumbers', 'emails', 'photos'],
                hasPhoneNumber : true
            };

            return $cordovaContacts.find(opts)
                .then(function (allContacts) {
                   var filtered =_.filter(allContacts, function(c) {
                       return (!(_.isEmpty(c.phoneNumbers)) &&  c.phoneNumbers.length > 0 )
                    });
                    var formatted = _.map(filtered, function(c) {
                        return {
                            "original": c,
                            "displayName": c.displayName || c.emails[0].value,
                            "number": c.phoneNumbers[0].value,
                            "photo": c.photos ? c.photos[0] ? c.photos[0].value : 'res/img/keilamies.png' : 'res/img/keilamies.png'
                        }
                    });
                    return formatted;
                  })
                .catch(function (err) {
                  return err;
           });
        }
    };
});
