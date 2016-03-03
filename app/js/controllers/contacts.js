'use strict';

/*
 * Controller for the contacts view with the listing of the device's contacts
 * Also, a factory wrapping ngCordova's contact plugin, which is a wrapper
 * around Cordova's contact plugin, which is a wrapper around the native
 * contacts API. Sweet!
 */

angular.module('contacts', [])
    .controller('ContactsCtrl', function($scope, $localStorage, $ionicModal, contactsFactory, modalFactory,  peerFactory, socketFactory, configFactory, $state, $ionicActionSheet, $translate) {

        var translations    = null;
        var newContactModal = null;

        translations = $translate(['SAR_CALL', 'PROFILE', 'ACTIONS', 'CANCEL']).then(function (trans) {
            translations = trans;
        });

        var reloadContactsList = function () {
            $scope.preloaderClass = 'preloader-on';

            contactsFactory.fetchContactsFromServer().then(function (contactsList) {
                $scope.$apply(function () {
                    contactsFactory.setContacts(contactsList);
                    $scope.contacts = contactsList;
                    $scope.preloaderClass = 'preloader-off';
                });
            }).catch(function(err) {
                modalFactory.alert($translate.instant('ERROR_TITLE', $translate.instant('ERROR_FETCH_CONTACTS')))
                $scope.preloaderClass = 'preloader-off';
            });
        };

        reloadContactsList();

        var updateContactState = function(data) {

            var stateToSet = data.eventType === socketFactory.eventTypes.CONTACT_ONLINE ? contactsFactory.contactStates.ONLINE : contactsFactory.contactStates.OFFLINE
            var didStateChange = contactsFactory.setContactStateIfApplicable(data.peerJSId, stateToSet);

            if (didStateChange) {
                contactsFactory.sortContactsByState();
                $scope.$apply(function () {
                    $scope.contacts = contactsFactory.getContacts();
                });
            }

        };

        socketFactory.registerCallback(socketFactory.eventTypes.CONTACT_ONLINE,  updateContactState);
        socketFactory.registerCallback(socketFactory.eventTypes.CONTACT_OFFLINE, updateContactState);

        $scope.searchKeyPress = function(keyCode) {
            // Enter and Android keyboard 'GO' key codes to close the keyboard
            if ((keyCode === 66 || keyCode === 13) && typeof cordova !== 'undefined') {
                cordova.plugins.Keyboard.close();
            }
        };

        $scope.addNewContactModalSubmit = function (newContact) {

            console.log(newContact);
            if (newContact && newContact.phoneNumber && newContact.displayName) {
                newContactModal.hide();

                $scope.preloaderClass = 'preloader-on';

                contactsFactory.addNewContact(newContact)
                .then(function (results) {
                    return contactsFactory.syncContactsWithServer();
                })
                .then(function (contacts) {
                    reloadContactsList();
                })
                .catch(function (error) {

                    console.log(error);
                });
            }
        };

        $scope.cancelAddContact = function () {
            newContactModal.hide();
        };

        $scope.addNewContact = function () {
            $ionicModal.fromTemplateUrl('templates/modals/add-contact.html',
                    {
                      animation : 'slide-in-up',
                      scope     : $scope
                    }
               ).then(function (modal) {
                newContactModal = modal;
                newContactModal.show();
            })

        };

        $scope.user = $localStorage.user;

        $scope.selectUser = function(selectedUser) {
            //if (selectedUser.currentState === contactsFactory.contactStates.ONLINE) {
                var sheetClass = selectedUser.currentState === contactsFactory.contactStates.ONLINE ? 'online' : 'offline';
                var sheet = $ionicActionSheet.show({
                    cssClass: sheetClass,
                    buttons: [
                        { text: '<i class="icon ion-ios-telephone"></i> <b>' + translations.SAR_CALL + '</b>' }
                        //{ text: '<i class="icon ion-android-person"></i> ' + translations.PROFILE }
                    ],
                    titleText:  translations.ACTIONS,
                    cancelText: translations.CANCEL,
                    cancel: function() {
                        sheet();
                    },

                    buttonClicked: function(index) {
                        switch (index) {
                            case 0:
                                peerFactory.callPeer(selectedUser)
                                    .then(function (user) {
                                         $state.go('call', { user: user });
                                    })
                                    .catch(function (error) {
                                        alert(error);
                                    })
                            break;
                            //case 1:
                            //    $state.go('userprofile', { user: selectedUser })
                            //break;
                        }
                        return true;
                    }
                });
           // }
        };
});

