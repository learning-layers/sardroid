'use strict';

/*
 * Controller for the registering screen 
 */

angular.module('register', [])
.controller('RegisterCtrl', function($scope, $state, $localStorage, $http, configFactory) {
    var url = configFactory.getValue('apiUrl');
});

