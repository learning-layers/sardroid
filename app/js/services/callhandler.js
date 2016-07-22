'use strict';

/*
 * Module for juggling call state.
 */

angular.module('call', [])
.factory('callFactory', function (apiFactory) {
    var callStates = {
        error: 'error',
        not_answered: 'not_answered',
        succeeded: 'succeeded'
    };

    var currentCallID = null;

    var initiateCall = function (recipient) {
        return new Promise(function (resolve, reject) {
            apiFactory.call.initiate(recipient)
                .then(function (newCall) {
                    currentCallID = newCall.CallId;
                    resolve(newCall);
                })
                .catch(function (callErr) {
                    reject(callErr);
                });
        });
    };

    var endCall = function (finalStatus) {
        return new Promise(function (resolve, reject) {
            if (!currentCallID) {
                return reject(new Error('Current call ID is null!'));
            }

            apiFactory.call.end(finalStatus, currentCallID)
                .then(function (endedCall) {
                    resolve(endedCall);
                })
                .catch(function (error) {
                    reject(error);
                })
                .finally(function () {
                    currentCallID = null;
                });
        });
    };

    return {
        initiateCall: initiateCall,
        callStates: callStates,
        callError: function () {
            return endCall(callStates.error);
        },
        callSucceeded: function () {
            return endCall(callStates.succeeded);
        },
        callNotAnswered: function () {
            return endCall(callStates.not_answered);
        }
    };
});

