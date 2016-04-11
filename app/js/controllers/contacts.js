'use strict';

/*
 * Controller for the contacts view with the listing of the device's contacts
 * See related controller under services-folder
 */

angular.module('contacts', [])
.controller('ContactsCtrl', function ($scope, $localStorage, $ionicModal, contactsFactory,
                                      modalFactory, peerFactory, socketFactory, configFactory,
                                      $state, $ionicActionSheet, $timeout, $translate, $window) {
    var newContactModal = null;
    var showUserModal   = null;

    var translations = $translate(['SAR_CALL', 'PROFILE', 'ACTIONS', 'CANCEL']).then(function (trans) {
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
        }).catch(function () {
            modalFactory.alert($translate.instant('ERROR_TITLE', $translate.instant('ERROR_FETCH_CONTACTS')));
            $scope.preloaderClass = 'preloader-off';
        });
    };


    var updateContactState = function (data) {
        var stateToSet = data.eventType === socketFactory.eventTypes.CONTACT_ONLINE ?
            contactsFactory.contactStates.ONLINE : contactsFactory.contactStates.OFFLINE;

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

    $scope.searchKeyPress = function (keyCode) {
        // Enter and Android keyboard 'GO' key codes to close the keyboard
        if (keyCode === 66 || keyCode === 13) {

            if (angular.isDefined($window.cordova)) {
                cordova.plugins.Keyboard.close();
            }
        }
    };

    $scope.isSearchBarVisible = false;

    $scope.addNewContactModalSubmit = function (newContact) {
        if (newContact && newContact.phoneNumber && newContact.displayName) {
            newContactModal.hide();

            $scope.preloaderClass = 'preloader-on';

            contactsFactory.addNewContact(newContact)
            .then(function () {
                return contactsFactory.syncContactsWithServer();
            })
            .then(function () {
                reloadContactsList();
            })
            .catch(function () {
            });
        } else if (newContact && !newContact.phoneNumber) {
            modalFactory.alert($translate.instant('ERROR'), $translate.instant('NUMBER_WRONG_FORMAT'));
        } else if (newContact && !newContact.displayName) {
            modalFactory.alert($translate.instant('ERROR'), $translate.instant('NAME_MISSING'));
        }
    };

    $scope.cancelAddContact = function () {
        newContactModal.hide();
    };

    $scope.addNewContact = function () {
        $ionicModal.fromTemplateUrl('templates/modals/add-contact.html', {
            animation : 'slide-in-up',
            scope     : $scope }
           )
           .then(function (modal) {
               newContactModal = modal;
               newContactModal.show();
           });
    };

    $scope.toggleSearchBar = function () {
        $scope.isSearchBarVisible = !$scope.isSearchBarVisible;

        if ($scope.isSearchBarVisible === true) {
            $timeout(function () {
                document.getElementById('search-bar').focus();
            }, 0);

        } else {
            if (cordova && cordova.plugins.Keyboard.isVisible === true) {
                cordova.plugins.Keyboard.close();
            }
        }
    }

    $scope.reloadContactsList = function () {
        $scope.preloaderClass = 'preloader-on';
        contactsFactory.syncContactsWithServer()
        .then(function () {
              reloadContactsList();
        });
    };

    $scope.user = $localStorage.user;

    $scope.selectUser = function (selectedUser) {
        console.log(selectedUser);
        $scope.selectedUser = selectedUser;

        $ionicModal.fromTemplateUrl('templates/modals/select-user.html', {
            scope: $scope,
            animation: 'slide-in-up'
         }).then(function (modal) {
             showUserModal = modal;
             showUserModal.show();
         });
        //var sheetClass = selectedUser.currentState === contactsFactory.contactStates.ONLINE ? 'online' : 'offline';
        //var sheet = $ionicActionSheet.show({
        //    cssClass: sheetClass,
        //    buttons: [
        //        { text: '<i class="icon ion-ios-telephone"></i> <b>' + translations.SAR_CALL + '</b>' }
        //    ],
        //    titleText:  translations.ACTIONS,
        //    cancelText: translations.CANCEL,
        //    cancel: function () {
        //        sheet();
        //    },

        //    buttonClicked: function (index) {
        //        switch (index) {
        //        case 0:
        //            peerFactory.callPeer(selectedUser)
        //            .then(function (user) {
        //                $state.go('call', { user: user });
        //            })
        //            .catch(function () {

        //            });
        //            break;
        //        }

        //        return true;
        //    }
        //});
    };

    reloadContactsList();
});

