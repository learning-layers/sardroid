'use strict';

/*
 *
 */

angular.module('callLog', [])
.controller('CallLogCtrl', function (callLogFactory, modalFactory, contactsFactory, $scope, $translate) {
    var translations = $translate.instant(['CALL_LOG_YOU_CALLED', 'CALL_LOG_THEY_CALLED',
                                          'CALL_LOG_THEY_NO_ANSWER', 'CALL_LOG_YOU_NO_ANSWER',
                                          'CALL_LOG_ERROR']);

    var currentPagination = 0;
    var paginationOffset = 10;

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

                            break;
                    }

                    return call;
                });

                $scope.haveAllCallsBeenLoaded = calls.length < paginationOffset;
                $scope.calls = $scope.calls.concat(formattedCalls);
                $scope.$broadcast('scroll.infiniteScrollComplete');

                currentPagination += paginationOffset;
            });
        })
        .catch(function (err) {
            modalFactory.alert($translate.instant('ERROR'), $translate.instant('CALL_LOG_FETCH_ERROR'));
        });
    };

    $scope.loadMoreCalls();
});

