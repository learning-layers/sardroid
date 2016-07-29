'use strict';

/*
 * Factory for manipulating the phone's native contacts.
 */
angular.module('contacts').factory('contactsFactory', function ($cordovaContacts, $http, $log,
                                                               $localStorage, apiFactory, intlpnFormatFilter) {
    // Array to store all the devices contacts so we don't have to re-fetch them all the time
    var contacts = [];

    var contactStates = {
        BUSY:    'busy',
        OFFLINE: 'offline',
        ONLINE:  'online'
    };

    return {

        contactStates: contactStates,

        fetchAllContacts: function () {
            // As far as I know, the fields do nothing. Cordova just YOLO's everything?
            var opts = {
                fields: ['id', 'displayName', 'name', 'phoneNumbers', 'emails', 'photos'],
                hasPhoneNumber : true
            };

            return new Promise(function (resolve, reject) {
                $cordovaContacts.find(opts)
                    .then(function (allContacts) {
                        var number;
                        var displayName = 'Unknown';
                        var photo = 'img/keilamies-small.png';
                        var userPhone = $localStorage.user.phoneNumber;

                        var formattedContacts = _.reduce(allContacts, function (formatted, c) {
                            if (!(_.isEmpty(c.phoneNumbers)) &&
                                c.phoneNumbers.length > 0
                                && c.phoneNumbers[0].value.replace(/[+ ]/g, '') !== userPhone) {
                                number = c.phoneNumbers[0].value.replace(/[+ ]/g, '');

                                if (c.displayName) displayName = c.displayName;
                                else if (!_.isEmpty(c.emails)) displayName = c.emails[0].value;

                                if (!_.isEmpty(c.photos)
                                    && angular.isDefined(c.photos[0])
                                    && angular.isDefined(c.photos[0].value)) {
                                    photo = c.photos[0].value;
                                }

                                formatted.push({
                                    displayName  : displayName,
                                    phoneNumber  : number,
                                    photo        : photo
                                });
                            }
                            return formatted;
                        }, []);

                        resolve(formattedContacts);
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            });
        },

        syncContactsWithServer: function () {
            var self = this;

            return new Promise(function (resolve, reject) {
                self.fetchAllContacts()
                    .then(function (results) {
                        return apiFactory.user.contacts.updateContactsList(results);
                    })
                    .then(function (syncedContacts) {
                        $localStorage.contactsBeenSynced = true;
                        self.setContacts(syncedContacts);
                        resolve(syncedContacts);
                    })
                    .catch(function (err) {
                        $log.log('Error syncing contacts!', err);
                        reject(err);
                    });
            });
        },

        fetchContactsFromServer: function () {
            return apiFactory.user.contacts.fetchContactsList();
        },

        addNewContact: function (newContact) {
            return new Promise(function (resolve, reject) {
                $cordovaContacts.save(
                    {
                        phoneNumbers: [new ContactField('mobile', newContact.phoneNumber, true)],
                        displayName: newContact.displayName
                    }
                )
                .then(function (results) {
                    $log.log(results);
                    resolve(results);
                })
                .catch(function (error) {
                    $log.log(error);
                    reject(error);
                });
            });
        },

        setContacts: function (newContacts) {
            contacts = newContacts;
        },

        getContactName: function (phoneNumber) {
            if (!phoneNumber) {
                return 'Unknown';
            }

            var contact = this.getContactByNumber(phoneNumber);

            if (contact) {
                return contact.displayName;
            } else {
                return intlpnFormatFilter('+' + phoneNumber);
            }
        },
        getContacts: function () {
            return contacts;
        },

        getContactByNumber: function (number) {
            return _.find(contacts, 'phoneNumber', number);
        },

        sortContactsByState: function () {
            contacts = _.sortBy(contacts, function (c) {
                return c.currentState === contactStates.OFFLINE;
            });
        },

        setContactStateIfApplicable: function (number, peerJSId, state) {
            var index = _.indexOf(contacts, this.getContactByNumber(number));

            if (index === -1) {
                return false;
            }

            contacts[index].currentState = state;
            contacts[index].peerJSId = peerJSId;

            if (state === contactStates.OFFLINE) {
                contacts[index].lastSeen = Date.now();
            }

            return true;
        }
    };
});

