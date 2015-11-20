'use strict';

var contacts = angular.module('contacts', ['ngCordova'])
.controller('ContactsCtrl', function($scope, $cordovaContacts) {

        $scope.getAllContacts = function() {
            $cordovaContacts.find({
                fields: ['id', 'displayName', 'name']})
            .then(function (allContacts) {
                $scope.contacts = allContacts
            })
            .catch(function(err) {
                console.log(err);
            })
        };

      $scope.getAllContacts();
});
