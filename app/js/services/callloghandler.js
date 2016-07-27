'use strict';

/*
 * Module for juggling call state.
 */

angular.module('callLog')
.factory('callLogFactory', function (apiFactory, $localStorage) {
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
                    currentCallID = newCall.id;
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
        },
        didCurrentLoggedInUserDoCall: function (call) {
            if (call && call.caller && $localStorage.user) {
                return call.caller.phoneNumber === $localStorage.user.phoneNumber;
            }
        },
        fetchMoreLogs: function (offset, limit) {
            return apiFactory.call.getLogs(offset, limit);
        }
    };
});

