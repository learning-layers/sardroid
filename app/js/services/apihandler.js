'use strict';

/*
 * Abstration layer for various RESTful API calls
 */

var apihandler = angular.module('apihandler', []);

apihandler.factory('apiFactory', function ($http, configFactory) {
    // Private API
    var apiUrl = configFactory.getValue('apiUrl');

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
        },
        GENERIC        : {
            MISSING_PARAMS    : 'missing_params',
            UNSPECIFIED_ERROR : 'unspecified_error'
        }
    };

    var formatError = function (error) {
        var errorMessage;
        var errorType;

        if (error.name || error.data) {
            errorType    = typeof error.data === 'undefined' ? error.name    : error.data.type
            errorMessage = typeof error.data === 'undefined' ? error.message : error.data.message
        } else {
            errorType    = errorTypes.GENERIC.UNSPECIFIED_ERROR;
            errorMessage = 'Unspecified error!';
        }
        console.log(errorType);
        console.log(errorMessage);
        return {
            name    : errorType.toUpperCase(),
            message : errorMessage
        }
    };

    var get = function (path) {
        return $http.get(apiUrl + path);
    };

    var post = function (path, params) {
        return new Promise(function (resolve, reject) {
            $http.post(apiUrl + path, params )
                .then(function (results) {
                    resolve(results.data)
                })
                .catch(function (error) {
                    console.log(error);
                    reject(formatError(error));
                })
        })
    };

    var del = function (path) {
        return new Promise(function (resolve, reject) {
            $http.delete(apiUrl + path)
                .then(function (results) {
                    resolve(results.data)
                })
                .catch(function (error) {
                    console.log(error);
                    reject(formatError(error));
                })
        })
    };

    // Public API
    return {
        errorTypes: errorTypes,

        setApiToken: function (token) {
            $http.defaults.headers.common.Authorization = 'Bearer: ' + token;
        },
        deleteApiToken: function () {
            delete $http.defaults.headers.common.Authorization;
        },

        auth: {
            login: function (phoneNumber, password) {
                return post('auth/login', { phoneNumber : phoneNumber, password : password });
            },
            logout: function () {
                return del('auth/logout');
            },
            verify: function (phoneNumber, verificationType) {
                return post('auth/verification', { phoneNumber : phoneNumber, verificationType: verificationType});
            },
            register: function (verificationCode, password) {
                return post('auth/register', { verificationCode: verificationCode, password: password });
            },
            resetPassword: function (verificationCode, password) {
                return post('auth/resetpw', { verificationCode: verificationCode, password: password });
            }
        }

    };
});

