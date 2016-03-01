
angular.module('contacts').factory('contactsFactory', function($cordovaContacts, $http, $localStorage, apiFactory, configFactory) {
    // Array to store all the devices contacts so we don't have to re-fetch them all the time
    var contacts = [];

    var contactStates = {
        BUSY:    'busy',
        OFFLINE: 'offline',
        ONLINE:  'online'
    };

    return {

        contactStates: contactStates,

        fetchAllContacts: function() {
            // As far as I know, the fields do nothing. Cordova just YOLO's everything?
            var opts = {
                fields: ['id', 'displayName', 'name', 'phoneNumbers', 'emails', 'photos'],
                hasPhoneNumber : true
            };

            return new Promise(function(resolve, reject) {
                $cordovaContacts.find(opts)
                    .then(function (allContacts) {
                        var userPhone = $localStorage.user.phoneNumber;

                        var formattedContacts = _.reduce(allContacts, function (formatted, c) {
                            if (!(_.isEmpty(c.phoneNumbers)) && c.phoneNumbers.length > 0 && c.phoneNumbers[0].value.replace(/[+ ]/g, '') !== userPhone) {
                                    var number = c.phoneNumbers[0].value.replace(/[+ ]/g, '');
                                    var displayName = 'Unknown';

                                    if (c.displayName) displayName = c.displayName;
                                    else if (!_.isEmpty(c.emails)) displayName = c.emails[0].value

                                    formatted.push({
                                        "original"     : c,
                                        "displayName"  : displayName,
                                        "phoneNumber"  : number,
                                        "photo"        : c.photos ? c.photos[0] ? c.photos[0].value : 'img/keilamies-small.png' : 'img/keilamies-small.png'
                                    });
                            }
                            return formatted;
                        }, []);

                        resolve(formattedContacts);
                    })
                    .catch(function (err) {
                        reject(err)
                    });
            })
        },

        syncContactsWithServer: function () {
            var self = this;
            return new Promise(function (resolve, reject) {
                self.fetchAllContacts()
                    .then(function (results) {
                        return apiFactory.user.contacts.updateContactsList(results)
                    })
                    .then(function (syncedContacts) {
                        $localStorage.contactsBeenSynced = true;
                        self.setContacts(syncedContacts);
                        resolve(syncedContacts);
                    })
                    .catch(function (err) {
                        console.log('Error syncing contacts!', err);
                        reject(err);
                })
            })
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
                    console.log(results);
                    resolve(results);
                })
                .catch(function (error) {
                    console.log(error);
                    reject(error);
                });
            })
        },

        setContacts: function (newContacts) {
            contacts = newContacts;
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

        setContactStateIfApplicable: function (number, state) {
            console.log(contacts);
            var index = _.indexOf(contacts, this.getContactByNumber(number));

            if (index === -1) {
                return false;
            }

            else {
                console.log('setting contact ' + number + ' state to ' + state);
                contacts[index].currentState = state;
                return true;
            }
        }
    };
});

