'use strict';

var peerhandler = angular.module('peerhandler', []);

peerhandler.factory('peerFactory', function($rootScope, $ionicPopup, $ionicHistory, $state, $timeout) {
    console.log($ionicHistory.currentView());
    console.log($state);
    // PeerJS object representing the user
    var me                = null;

    // Stream object;
    var localStream       = null;

    // Stream sources
    var remoteVideoSource = null;
    var localVideoSource  = null;

    // currentCall   = local
    // currentAnswer = remote
    var currentCall   = null;
    var currentAnswer = null;


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
        remoteVideoSource = window.URL.createObjectURL(stream);
    };

    var setLocalStreamSrc = function (stream) {
        localVideoSource = window.URL.createObjectURL(stream);
    };


    var endCallAndGoBack = function() {
        endCurrentCall();
        if ($state.current.name === "call") {
            $ionicHistory.goBack();
        }
    }

    var callAlertModal = function(reasonMessage) {
        var callEndedAlert = $ionicPopup.alert({
            title: 'Call over!',
            template: reasonMessage
        });
        callEndedAlert.then(function() {
            endCallAndGoBack();
        });

    };

    var answer = function(call) {
        currentAnswer = call;
        call.on('stream', setRemoteStreamSrc);
        call.on('close', function() {
            callAlertModal('Call ended by the other')
        });

        call.on('error', function(error) {
            callAlertModal('Error: ' + error.toString());
        });

        call.answer(localStream);
    };


    var endCurrentCall = function() {
        if (currentCall) {
            currentCall.close();
            currentCall = null;
        }

        if (currentAnswer) {
            currentAnswer.close();
            currentAnswer = null;
        }
    };

     var disconnectFromPeerJS = function() {
        if (me) {
            me.disconnect();
            me.destroy();
            me = null;
            endCurrentCall();
        } else {
            console.log("Warning! Attempted to disconnect without connecting")
        }
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

            var disconnectRef = this.disconnectFromPeerJS;

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
                        }, 500)
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

            me.on('close', function() {
               console.log('closed Peerjs connection');
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
                 if (_.contains(errorMsg, 'Lost connection to server') || _.contains(errorMsg, 'is taken')) {
                     disconnectRef();
                     $state.go('login');
                 }
              });
            });
        },
        callPeer: function (userToCall) {
            if (!me) {
                console.log("Warning! no peerjs connection")
            }

            getLocalStream(function (stream) {
                currentCall = me.call(userToCall.number, stream, { metadata: me.id});
                currentCall.on('error', function (err) {
                    endCurrentCall();

                });

                currentCall.on('stream', function(stream) {
                    console.log('going to stream from call')
                    setRemoteStreamSrc(stream);

                    $timeout(function() {
                         $state.go('call', {user: userToCall});
                     }, 500)

                });

                currentCall.on('close', function() {
                    endCallAndGoBack();
                });
            });

        },
        endCurrentCall: function() {
            endCurrentCall();
        },
        disconnectFromPeerJS: function() {
            disconnectFromPeerJS();
        }
    }
});
