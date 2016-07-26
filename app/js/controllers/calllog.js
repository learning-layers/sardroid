'use strict';

/*
 *
 */

angular.module('callLog', [])
.controller('CallLogCtrl', function (callLogFactory, contactsFactory, $scope, $translate) {
    var translations = $translate.instant(['CALL_LOG_YOU_CALLED', 'CALL_LOG_THEY_CALLED',
                                          'CALL_LOG_THEY_NO_ANSWER', 'CALL_LOG_YOU_NO_ANSWER',
                                          'CALL_LOG_ERROR']);

    callLogFactory.fetchLogsFromServer()
    .then(function (calls) {
        $scope.$apply(function () {
            var formattedCalls = calls.map(function (call) {
                var didUserDoCall = callLogFactory.didCurrentLoggedInUserDoCall(call);
                if (didUserDoCall) {
                    call.text = translations.CALL_LOG_YOU_CALLED;
                    call.userInfo = contactsFactory.getPresentableContactName(call.recipient.phoneNumber);
                } else {
                    call.text = translations.CALL_LOG_THEY_CALLED;
                    call.userInfo = contactsFactory.getPresentableContactName(call.caller.phoneNumber);
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

            $scope.calls = formattedCalls;
        });
    })
    .catch(function (err) {
        console.log(err);
    });
});

