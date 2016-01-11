
angular.module('contacts').factory('contactsFactory', function($cordovaContacts, $http, $localStorage, configFactory) {
    // Array to store all the devices contacts so we don't have to re-fetch them all the time
    var contacts = [];

    var contactStates = {
        BUSY:    "busy",
        OFFLINE: "offline",
        ONLINE:  "online"
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
                            $http({
                                method: 'GET',
                                url:  configFactory.getValue('onlineContactsLocation')
                            })
                            .then(function success(results) {

                                    var onlineUsers = results.data.map(function (c) {
                                        return "+" + c;
                                    });

                                    var userPhone = $localStorage.user.phoneNumber;

                                    var formattedContacts = _.reduce(allContacts, function (formatted, c) {
                                        if (!(_.isEmpty(c.phoneNumbers)) && c.phoneNumbers.length > 0 && c.phoneNumbers[0].value !== userPhone) {
                                                var number = c.phoneNumbers[0].value;

                                                //TODO: Make this more legit
                                                if (number.substring(0, 4) !== '+358' && number.substring(0, 1) === '0') {
                                                    number = "+358" + number.substring(1);
                                                }

                                                formatted.push({
                                                    "original": c,
                                                    "displayName": c.displayName || c.emails[0].value,
                                                    "phoneNumber": number,
                                                    "photo": c.photos ? c.photos[0] ? c.photos[0].value : 'res/img/keilamies.png' : 'res/img/keilamies.png',
                                                    "currentState": _.includes(onlineUsers, number) ? contactStates.ONLINE : contactStates.OFFLINE
                                                });
                                        }
                                        return formatted;
                                    }, []);

                                    contacts = formattedContacts;
                                    resolve(formattedContacts);
                                },
                                function error(error) {
                                    console.log(error);
                                    reject(error)
                                } )
                    })
                    .catch(function (err) {
                        reject(err)
                    });
            })
        },

        getContacts: function () {
            return contacts;
        },

        getContactByNumber: function (number) {
            return _.find(contacts, 'phoneNumber', number);
        },

        sortContactsByState: function () {
            console.log('Sorting array!');
            contacts = _.sortBy(contacts, function (c) {
                return c.currentState === contactStates.OFFLINE;
            });
        },

        setContactStateIfApplicable: function (number, state) {
            var index = _.indexOf(contacts, this.getContactByNumber(number));
            console.log('attempting to set contact ' + number + ' state to ' + state);

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

