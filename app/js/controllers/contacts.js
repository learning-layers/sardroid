'use strict';

/*
 * Controller for the contacts view with the listing of the device's contacts
 * See related controller under services-folder
 */

angular.module('contacts', [])
.controller('ContactsCtrl', function ($scope, $localStorage, $ionicPopup, contactsFactory, callLogFactory,
                                      modalFactory, peerFactory, socketFactory, configFactory, apiFactory,
                                      $state, $timeout, $translate, $window, $ionicModal) {
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

    var closeCallModalOnClick = function (e) {
        if (e.target.nodeName === 'HTML') {
            if (showUserModal) {
                showUserModal.close();
                showUserModal = null;
                document.querySelector('html').removeEventListener('click', closeCallModalOnClick);
            }
        }
    };

    var addNewContactAndSync = function (newContact) {
        contactsFactory.addNewContact(newContact)
        .then(function () {
            return contactsFactory.syncContactsWithServer();
        })
        .then(function () {
            reloadContactsList();
        })
        .catch(function (error) {
            console.log(error);
        });
    };

    var updateContactState = function (data) {
        var stateToSet = data.eventType === socketFactory.eventTypes.CONTACT_ONLINE ?
            contactsFactory.contactStates.ONLINE : contactsFactory.contactStates.OFFLINE;

        var didStateChange = contactsFactory.setContactStateIfApplicable(data.phoneNumber, data.peerJSId, stateToSet);

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
            apiFactory.user.exists(newContact.phoneNumber)
                .then(function (response) {
                    if (response.found === true) {
                        newContactModal.hide();
                        $scope.preloaderClass = 'preloader-on';
                        addNewContactAndSync(newContact);
                    } else {
                        modalFactory.confirm($translate.instant('WARNING'), $translate.instant('ADD_USER_NOT_FOUND', { phoneNumber: newContact.phoneNumber }))
                            .then(function (promptRes) {
                                if (promptRes === true) {
                                    newContactModal.hide();
                                    $scope.preloaderClass = 'preloader-on';
                                    addNewContactAndSync(newContact);
                                } else {
                                    return;
                                }
                            });
                    }
                })
                .catch(function (err) {

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
    };

    $scope.reloadContactsList = function () {
        $scope.preloaderClass = 'preloader-on';
        contactsFactory.syncContactsWithServer()
        .then(function () {
            reloadContactsList();
        });
    };

    $scope.user = $localStorage.user;

    $scope.callUser = function (userToCall) {
        showUserModal.close();

        callLogFactory.initiateCall(userToCall.phoneNumber)
        .then(function () {
            return peerFactory.callPeer(userToCall);
        })
        .then(function (user) {
            document.querySelector('html').removeEventListener('click', closeCallModalOnClick);
            $state.go('call', { user: user });
        })
        .catch(function (error) {
            callLogFactory.callError();
        });
    };

    $scope.selectUser = function (selectedUser) {
        $scope.selectedUser = selectedUser;

        showUserModal = $ionicPopup.show({
            templateUrl: 'templates/modals/select-user.html',
            title: selectedUser.displayName,
            scope: $scope
        });

        // Hack for allowing us to close the popup on
        // clicking the backdrop
        document.querySelector('html').addEventListener('click', closeCallModalOnClick);
    };

    reloadContactsList();
});

