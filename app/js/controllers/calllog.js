'use strict';

/*
 *
 */

angular.module('callLog', [])
.controller('CallLogCtrl', function (callLogFactory, modalFactory, contactsFactory,
                                     $scope, $translate, $localStorage) {
    var translations = $translate.instant(['CALL_LOG_YOU_CALLED', 'CALL_LOG_THEY_CALLED',
                                          'CALL_LOG_THEY_NO_ANSWER', 'CALL_LOG_YOU_NO_ANSWER',
                                          'CALL_LOG_ERROR', 'CALL_LOG_DURATION']);

    var currentPagination = 0;
    var paginationOffset = 10;

    var getCallDuration = function (callStarted, callEnded) {
        var ms = (new Date(callEnded) - new Date(callStarted));
        var min = (ms / 1000 / 60) << 0;
        var sec = (ms / 1000) % 60;


        return Math.round(min) + ':' + Math.round(sec);
    };


    $scope.calls = [];

    $scope.loadMoreCalls = function () {
        callLogFactory.fetchMoreLogs(currentPagination, paginationOffset)
        .then(function (calls) {
            $scope.$apply(function () {
                var formattedCalls = calls.map(function (call) {
                    var didUserDoCall = callLogFactory.didCurrentLoggedInUserDoCall(call);

                    if (didUserDoCall) {
                        call.text = translations.CALL_LOG_YOU_CALLED;
                        call.userInfo = contactsFactory.getContactName(call.recipient.phoneNumber);
                    } else {
                        call.text = translations.CALL_LOG_THEY_CALLED;
                        call.userInfo = contactsFactory.getContactName(call.caller.phoneNumber);
                    }

                    switch (call.finalStatus) {
                        case callLogFactory.callStates.not_answered:
                        if (didUserDoCall) {
                            call.text += translations.CALL_LOG_THEY_NO_ANSWER;
                        } else {
                            call.text += translations.CALL_LOG_YOU_NO_ANSWER;
                        }
                        break;
                        case callLogFactory.callStates.error:
                            call.text += translations.CALL_LOG_ERROR;

                        break;
                        case callLogFactory.callStates.succeeded:
                            call.durationText = translations.CALL_LOG_DURATION + getCallDuration(call.startedAt, call.endedAt);
                            break;
                    }

                    call.hasBeenSeen = !call.missedCallBeenSeen && call.recipientId == $localStorage.user.id;

                    return call;
                });

                $scope.haveAllCallsBeenLoaded = calls.length < paginationOffset;
                $scope.calls = $scope.calls.concat(formattedCalls);
                $scope.$broadcast('scroll.infiniteScrollComplete');

                currentPagination += paginationOffset;

                callLogFactory.markCallsAsSeen(calls);
            });
        })
        .catch(function (err) {
            modalFactory.alert($translate.instant('ERROR'), $translate.instant('CALL_LOG_FETCH_ERROR'));
        });
    };

    $scope.loadMoreCalls();
});

