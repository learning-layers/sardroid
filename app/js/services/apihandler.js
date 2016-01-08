'use strict';

/*
 * Abstration layer for various RESTful api calls
 */

var apihandler = angular.module('apihandler', []);

apihandler.factory('apiFactory', function ($http, configFactory) {
    // Private API
    var url = configFactory.getValue('apiUrl')

    // Public API
    return {};
});

