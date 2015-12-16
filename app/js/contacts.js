'use strict';

/*
 * Controller for the contacts view with the listing of the device's contacts
 * Also, a factory wrapping ngCordova's contact plugin, which is a wrapper
 * around Cordova's contact plugin, which is a wrapper around the native
 * contacts API. Sweet!
 */

var contacts = angular.module('contacts', ['ngCordova', 'peerhandler'])
.controller('ContactsCtrl', function($scope, $localStorage, contactsFactory, peerFactory, socketFactory, $state, $ionicActionSheet, $translate) {

        var translations = null;

        var translations = $translate(['SAR_CALL', 'PROFILE', 'ACTIONS', 'CANCEL']).then(function (trans) {
            translations = trans;
        });

        contactsFactory.fetchAllContacts().then(function (results) {
            $scope.contacts = results;
            console.log(results);
        }).catch(function(err) {
            console.log(err);
        });

        var updateContactState = function() {
            $scope.$apply(function () {
                $scope.contacts = contactsFactory.getContacts();
            });
        }

        socketFactory.registerCallback(socketFactory.eventTypes.CONTACT_ONLINE,  updateContactState);
        socketFactory.registerCallback(socketFactory.eventTypes.CONTACT_OFFLINE, updateContactState);
        
        $scope.searchKeyPress = function(keyCode) {
            // Enter and Android keyboard 'GO' keycodes to close the keyboard
            if ((keyCode === 66 || keyCode === 13) && typeof cordova !== 'undefined') {
                cordova.plugins.Keyboard.close();
            }
        };

        $scope.user = $localStorage.user;

        $scope.selectUser = function(selectedUser) {

            var sheet = $ionicActionSheet.show({

                buttons: [
                    { text: '<i class="icon ion-ios-telephone"></i> <b>' + translations.SAR_CALL + '</b>' },
                    { text: '<i class="icon ion-android-person"></i> ' + translations.PROFILE },
                ],
                titleText:  translations.ACTIONS,
                cancelText: translations.CANCEL,
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
    // Array to store all the devices contacts so we don't have to re-fetch them all the time
    var contacts = [];

    var contactStates = {
        BUSY:    "busy",
        OFFLINE: "offline",
        ONLINE:  "online"
    }

    return {
        contactStates: contactStates,

        fetchAllContacts: function() {
            // As far as I know, the fields do nothing. Cordova just YOLO's everything?
            var opts = {
                fields: ['id', 'displayName', 'name', 'phoneNumbers', 'emails', 'photos'],
                hasPhoneNumber : true
            };

            return $cordovaContacts.find(opts)
                .then(function (allContacts) {
                    //TODO: Maybe optimize this filter and format shebang a bit
                   var filtered =_.filter(allContacts, function(c) {
                       return (!(_.isEmpty(c.phoneNumbers)) &&  c.phoneNumbers.length > 0 )
                    });
                    var formatted = _.map(filtered, function(c) {
                        return {
                            "original": c,
                            "displayName": c.displayName || c.emails[0].value,
                            "number": c.phoneNumbers[0].value,
                            "photo": c.photos ? c.photos[0] ? c.photos[0].value : 'res/img/keilamies.png' : 'res/img/keilamies.png',
                            "currentState": contactStates.OFFLINE
                        }
                    });
                    contacts = formatted;
                    return formatted;
                  })
                .catch(function (err) {
                  return err;
           });
        },

        getContacts: function () {
            return contacts;
        },

        getContactByNumber(number) {
            return _.find(contacts, 'number', number);
        },
        setContactState(number, state) {
            var index = _.indexOf(contacts, this.getContactByNumber(number));

            if (index != -1) {
                console.log('setting contact ' + number + ' state to ' + state);
                contacts[index].currentState = state;
            }
        }
    };
});

