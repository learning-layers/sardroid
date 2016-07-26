'use strict';

/*
 *
 */

angular.module('callLog', [])
.controller('CallLogCtrl', function (callLogFactory, contactsFactory, $scope) {
    callLogFactory.fetchLogsFromServer()
    .then(function (calls) {
        $scope.$apply(function () {
            console.log(calls);

            var formattedCalls = calls.map(function (call) {
                var didUserDoCall = callLogFactory.didCurrentLoggedInUserDoCall(call);

                if (didUserDoCall) {
                    call.text = 'You called ' + contactsFactory.getPresentableContactName(call.recipient.phoneNumber);
                } else {
                    call.text = contactsFactory.getPresentableContactName(call.caller.phoneNumber) + " called you";
                }

                switch (call.finalStatus) {
                    case callLogFactory.callStates.not_answered:
                        if (didUserDoCall) {
                            call.text += ", but they didn't answer"
                        } else {
                            call.text += ", but you didn't answer"
                        }
                    break;
                    case callLogFactory.callStates.error:
                        call.text += ', but something went wrong'

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

