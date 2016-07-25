'use strict';

/*
 * Abstration layer for various RESTful API calls
 */

angular.module('apihandler', [])
.factory('apiFactory', function ($http, $log, $rootScope, configFactory) {
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
            REGISTER_FAILED      : 'register_failed'
        },
        LOGIN          : {
            USER_NOT_FOUND : 'user_not_found',
            BCRYPT_ERROR   : 'bcrypt_error',
            WRONG_PASSWORD : 'wrong_password'
        },
        RESET_PASSWORD       : {
            NO_VERIFICATION      : 'no_verification',
            USER_NOT_FOUND       : 'user_not_found',
            VERIFICATION_EXPIRED : 'verification_expired',
            VERIFICATION_USED    : 'verification_used',
            RESET_FAILED         : 'register_failed'
        },
        GENERIC        : {
            MISSING_PARAMS    : 'missing_params',
            TOKEN_MISSING     : 'token_missing',
            TWILIO_ERROR      : 'twilio_error',
            UNSPECIFIED_ERROR : 'unspecified_error'
        },
        CONTACTS        : {
            SAVE_ERROR    : 'save_error',
            INVALID_STATE : 'invalid_state'
        }
    };

    var formatError = function (error) {
        var errorMessage;
        var errorType;

        if (error.name || error.data) {
            errorType    = angular.isUndefined(error.data) ? error.name    : error.data.type;
            errorMessage = angular.isUndefined(error.data) ? error.message : error.data.message;
        } else {
            errorType    = errorTypes.GENERIC.UNSPECIFIED_ERROR;
            errorMessage = 'Unspecified error!';
        }

        $log.log(error);

        return {
            name    : errorType ? errorType.toUpperCase() : null,
            message : errorMessage
        };
    };

    // TODO: DRY up these HTTP helper methods?
    var get = function (path) {
        return new Promise(function (resolve, reject) {
            $rootScope.hideLoader = false;
            $http.get(apiUrl + path)
                .then(function (results) {
                    resolve(results.data);
                })
                .catch(function (error) {
                    reject(formatError(error));
                })
                .finally(function () {
                    $rootScope.hideLoader = true;
                });
        });
    };

    var post = function (path, params) {
        return new Promise(function (resolve, reject) {
            $rootScope.hideLoader = false;
            $http.post(apiUrl + path, params)
                .then(function (results) {
                    resolve(results.data);
                })
                .catch(function (error) {
                    $log.log(error);
                    reject(formatError(error));
                })
                .finally(function () {
                    $rootScope.hideLoader = true;
                });
        });
    };

    var put = function (path, params) {
        return new Promise(function (resolve, reject) {
            $rootScope.hideLoader = false;
            $http.put(apiUrl + path, params)
                .then(function (results) {
                    resolve(results.data);
                })
                .catch(function (error) {
                    $log.log(error);
                    reject(formatError(error));
                })
                .finally(function () {
                    $rootScope.hideLoader = true;
                });
        });
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
            logout: function (deviceToken) {
                return put('auth/logout', { deviceToken: deviceToken });
            },
            verify: function (phoneNumber, verificationType) {
                return post('auth/verification', { phoneNumber : phoneNumber, verificationType: verificationType });
            },
            register: function (verificationCode, password) {
                return post('auth/register', { verificationCode: verificationCode, password: password });
            },
            resetPassword: function (verificationCode, password) {
                return post('auth/resetpw', { verificationCode: verificationCode, password: password });
            }
        },
        call: {
            initiate: function (recipientNumber) {
                return post('call/initiate', { recipientNumber: recipientNumber });
            },
            end: function (finalStatus, callID) {
                return put('call/' + callID + '/end', { finalStatus: finalStatus });
            }
        },
        user: {
            contacts: {
                updateContactsList: function (contactsList) {
                    return post('user/contacts', { contactsList: contactsList });
                },
                fetchContactsList: function () {
                    return get('user/contacts');
                }
            },
            notifications: {
                registerDevice: function (deviceToken) {
                    return post('user/notifications/register', { deviceToken: deviceToken });
                }
            },
            exists: function (phoneNumber) {
                return get('user/' + phoneNumber + '/exists');
            }
        }
    };
});

