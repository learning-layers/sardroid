'use strict';

/*
 * Module for juggling call and such!
 */

angular.module('callLog')
.factory('callLogFactory', function (apiFactory, $localStorage, $rootScope) {
    var callStates = {
        error: 'error',
        not_answered: 'not_answered',
        succeeded: 'succeeded'
    };

    var currentCallID = null;

    var callsNotSeen = [];

    var filterNotSeenCalls = function (calls) {
        return _.filter(calls, function (call) {
            return (call.missedCallBeenSeen === false) && $localStorage.user.id === call.recipientId;
        });
    }

    var setCallLogBadge = function (number) {
        $rootScope.notSeenCallsCount = number;
    };

    var decrementCallLogBadge = function (number) {
        if ($rootScope.notSeenCallsCount - number >= 0) {
            $rootScope.notSeenCallsCount -= number
        }
    };

    var fetchNotSeenCalls = function () {
         return new Promise(function (resolve, reject) {
            apiFactory.call.getNotSeen()
                .then(function (notSeenCalls) {
                    callsNotSeen = notSeenCalls
                    setCallLogBadge(notSeenCalls.length);
                    resolve(notSeenCalls);
                })
                .catch(function (callErr) {
                    reject(callErr);
                });
        });
    };

    var markCallsAsSeen = function (calls) {
         return new Promise(function (resolve, reject) {
             var callsToMarkAsSeen = filterNotSeenCalls(calls);
             if (callsToMarkAsSeen.length === 0) {
                 return resolve();
             } else {
                 decrementCallLogBadge(callsToMarkAsSeen.length);

                 return apiFactory.call.markAsSeen(callsToMarkAsSeen)
                    .then(function (results) {
                        resolve(results);
                    })
                    .catch(function (error) {
                        reject(error);
                    });
             }
        });
    };

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
        },
        fetchNotSeenCalls: fetchNotSeenCalls,
        markCallsAsSeen: markCallsAsSeen
    };
});

