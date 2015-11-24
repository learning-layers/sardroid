'use strict';

var peerhandler = angular.module('peerhandler', []);

peerhandler.factory('peerFactory', function($rootScope, $ionicPopup, $ionicHistory, $state, $timeout) {
    // PeerJS object representing the user
    var me                = null;

    // Stream object;
    var localStream       = null;

    // Stream sources
    var remoteVideoSource = null;
    var localVideoSource  = null;

    var currentCall   = null;

    // Private api
    var getLocalStream = function(successCallback) {
        if (localStream && successCallback) {
            successCallback(localStream)
        } else {
            navigator.webkitGetUserMedia(
                {
                    audio: true,
                    video: true
                },
                function (stream) {
                    localStream = stream;
                    setLocalStreamSrc(stream);
                    if (successCallback) {
                        successCallback(stream);
                    }
                },
                function(err){
                    console.log(err);
                }
            )
        }
    };

    var setRemoteStreamSrc = function (stream) {
        console.log('setting remote source!');
      remoteVideoSource = window.URL.createObjectURL(stream);
        console.log(remoteVideoSource);
    };

    var setLocalStreamSrc = function (stream) {
        console.log('setting local source!');
        localVideoSource = window.URL.createObjectURL(stream);
        console.log(localVideoSource);
    };

    var answer = function(call) {
        call.on('stream', setRemoteStreamSrc);
        call.on('close', function() {
            var callEndedAlert = $ionicPopup.alert({
                title: 'Call over!',
                template: 'Call was ended by the other party'
            });
            callEndedAlert.then(function() {
                $ionicHistory.goBack();
            });
        });

        call.answer(localStream);
    };

    // Public PeerJS api
    return {
        getMe: function() {
            if (!me) {return null;}
            return me;
        },
        getRemoteStreamSrc: function() {
            if (!remoteVideoSource) {console.log('No video remote source!')}
            return remoteVideoSource;
        },
        getLocalStreamSrc: function() {
            if (!localVideoSource) {console.log('No video remote source!')}
            return localVideoSource;
        },
        isConnected: function() {
            if (!me) {return false}
            else {return !me.disconnected}
        },
        connectToPeerJS: function(id)   {
            me = new Peer(id, $rootScope.config.peerjs);

            if (!me) {
              alert('Error creating peer!');
            }
            me.on('open', function(id) {
                console.log('Connection opened: ' + id);
            });

            me.on('call', function(mediaConnection) {
              console.log('Call initiated by ' + mediaConnection.peer );

                var confirmPopup = $ionicPopup.confirm({
                    title: 'Call from ' + mediaConnection.peer,
                    template: 'Incoming call. Answer?'
                });
                confirmPopup.then(function(res) {
                    if(res) {
                        answer(mediaConnection);
                        $timeout(function() {
                            $state.go('call', {user: { displayName: mediaConnection.peer }});
                        }, 200)
                    } else {
                        mediaConnection.close();
                        return false;
                    }
                });
            });

            me.on('connection', function(dataConnection) {
                console.log('dataconnection formed!');
                console.log(dataConnection);
            });

            me.socket._socket.onopen = function() {
              getLocalStream();
            };

            me.on('error', function(error) {
              var errorMsg = error.toString();
              var errorAlert = $ionicPopup.alert({
                  title: 'Something went wrong!',
                  template: errorMsg
              });
             errorAlert.then(function(res) {
                 if (_.contains(errorMsg, 'Lost connection to server')) {
                     $state.go('login');
                 }
              });
            });
        },
        callPeer: function (userToCall) {
            if (!me) return;

            getLocalStream(function (stream) {
                currentCall = me.call(userToCall.number, stream, { metadata: me.id})
                currentCall.on('error', function (err) {
                    console.log('Call error');
                });

                currentCall.on('stream', function(stream) {
                    setRemoteStreamSrc(stream);
                    $timeout(function() {
                        $state.go('call', {user: userToCall});
                    }, 200)
                });

                currentCall.on('close', function() {
                    console.log('call closed');
                });
            });

        },
        endCurrentCall: function() {
            if (currentCall) {
                currentCall.close();
                currentCall = null;
            }
        },
        disconnectFromPeerJS: function() {
            me.disconnect();
        }
    }
});
