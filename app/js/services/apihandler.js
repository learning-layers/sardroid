'use strict';

/*
 * Abstration layer for various RESTful API calls
 */

var apihandler = angular.module('apihandler', []);

apihandler.factory('apiFactory', function ($http, configFactory) {
    // Private API
    var url = configFactory.getValue('apiUrl');

    // Various different kinds of errors that can be returned from the REST API
    var errorTypes = {
        VERIFICATION   : {
            USER_EXISTS    : 'user_exists',
            NUMBER_MISSING : 'number_missing'
        },
        REGISTER       : {
            NO_VERIFICATION      : 'no_verification',
            VERIFICATION_EXPIRED : 'verification_expired',
            VERIFICATION_USED    : 'verification_used',
            REGISTER_FAILED      : 'register_failed',
        },
        LOGIN          : {
            USER_NOT_FOUND : 'user_not_found',
            BCRYPT_ERROR   : 'bcrypt_error',
            WRONG_PASSWORD : 'wrong_password'
        }
    };

    // Public API
    return {};
});

