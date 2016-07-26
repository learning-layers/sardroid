'use strict';

/*
 *
 */

angular.module('callLog', [])
.controller('CallLogCtrl', function (callLogFactory, $scope) {
    callLogFactory.fetchLogsFromServer()
    .then(function (calls) {
        $scope.$apply(function () {
            console.log(calls);

            var formattedCalls = calls.map(function (call) {
                var didUserDoCall = callLogFactory.didCurrentLoggedInUserDoCall(call);

                if (didUserDoCall) {
                    call.text = call.caller.phoneNumber + " called you";
                } else {
                    call.text = 'You called ' + call.recipient.phoneNumber;
                }

                if (call.state === callLogFactory.callStates.not_answered && didUserDoCall) {
                    call.text += ", but they didn't answer"
                } else {
                    call.text += ", but you didn't answer"
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

