'use strict';

var contacts = angular.module('contacts', [])
.controller('ContactsCtrl', function($scope, contactsFactory) {console.log(contactsFactory.sayHello())});

contacts.factory('contactsFactory', function() {
    return {
        sayHello: function() {
            return "Hello, World!"
        }
    };
});

