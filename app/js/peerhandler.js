'use strict';

var peerhandler = angular.module('peerhandler', ['ngCordova']);

peerhandler.factory('peerFactory', function($rootScope, $ionicPopup, $ionicHistory, $state, $timeout, $cordovaLocalNotification) {
    // PeerJS object representing the user
    var me                = null;

    // Stream object;
    var localStream       = null;

    // Stream sources
    var remoteVideoSource = null;
    var localVideoSource  = null;

    // currentCallStream   = local
    // currentAnswerStream = remote
    var currentCallStream   = null;
    var currentAnswerStream = null;

    // Seperate data connection for sending data
    var dataConnection = null;

    // Get a suitable camera for video (first choice is backwards-facing camera)
    var getDeviceCameraID= function() {
        return new Promise(function(resolve, reject) {
            var first = false;
            var back  = false;

            MediaStreamTrack.getSources(function(src) {
                for (var i in src) {
                    if (src[i].kind === 'video') {

                        if (!first) {
                            first = src[i].id;
                        }

                        if (src[i].facing === 'environment') {
                            back = src[i].id;
                        }

                    }
                }
                resolve(back || first);
            });
        })
    };

    // Private api
    var getLocalStream = function(successCallback) {
        if (localStream && successCallback) {
            successCallback(localStream)
        } else {
            getDeviceCameraID().then(function (id) {
                var videoSettings = {};

                if (id) {
                    videoSettings.optional = [{sourceId: id}];
                }

                navigator.webkitGetUserMedia(
                    {
                        audio: true,
                        video: videoSettings
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
            })
        }
    };

    var setRemoteStreamSrc = function (stream) {
        remoteVideoSource = window.URL.createObjectURL(stream);
    };

    var setLocalStreamSrc = function (stream) {
        localVideoSource = window.URL.createObjectURL(stream);
    };

    var setDataConnection = function(dataConn) {
        dataConn.on('open', function() {
            console.log('Dataconnection opened')
            dataConn.on('data', function(data) {
                console.log('data received!');
                console.log(data);
            });

            dataConn.on('error', function(err) {
             console.log('dataconnection error!')
             console.log(err);
         })
        dataConnection = dataConn;
        })
    };

    var sendData = function(data) {
        if (dataConnection) { dataConnection.send(data); }
        else {
            console.log('uhoh! data was null')
        }
    }

    var closeDataConnection = function() {
        console.log('closing data connection')
      if (dataConnection) { dataConnection.close() }
        dataConnection = null;
    };

    var endCallAndGoBack = function() {
        endCurrentCall();
        if ($state.current.name === "call") {
            $ionicHistory.goBack();
        }
    };

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
        currentAnswerStream = call;
        call.on('stream', setRemoteStreamSrc);
        call.on('close', function() {
            endCallAndGoBack();
        });

        call.on('error', function(error) {
            callAlertModal('Error: ' + error.toString());
        });

        call.answer(localStream);
    };


    var endCurrentCall = function() {
        closeDataConnection();
        if (currentCallStream) {
            currentCallStream.close();
            currentCallStream = null;
        }

        if (currentAnswerStream) {
            currentAnswerStream.close();
            currentAnswerStream = null;
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
            if (!remoteVideoSource) {
                console.log('No video remote source!');
                return null;
            }
            return remoteVideoSource;
        },
        getLocalStreamSrc: function() {
            if (!localVideoSource) {
                console.log('No video remote source!')
                return null;
            }
            return localVideoSource;
        },
        isConnected: function() {
            if (!me) {return false}
            else {return !me.disconnected}
        },
        connectToPeerJS: function(id)   {
            var disconnectRef = this.disconnectFromPeerJS;

            return new Promise(function(resolve, reject) {

                me = new Peer(id, $rootScope.config.peerjs);

                if (!me) {
                    alert('Error creating peer!');
                    reject();
                }
                me.on('open', function(id) {
                    resolve();
                    console.log('Connection opened: ' + id);
                });

                me.on('call', function(mediaConnection) {
                    console.log('Call initiated by ' + mediaConnection.peer );


                    $cordovaLocalNotification.schedule({
                        id: 1,
                        title: 'SAR Call from ' + mediaConnection.peer,
                        text: 'SAR Call from ' + mediaConnection.peer
                    }).then(function (result) {
                        console.log(result);
                    });

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
                            $cordovaLocalNotification.cancel(1).then(function (result) {
                                console.log(result);
                            });
                            mediaConnection.close();
                            return false;
                        }
                    });
                });

                me.on('connection', function(dataConn) {
                    setDataConnection(dataConn);
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
            })
        },
        isDataConnectionOpen: function() {
          if (dataConnection === null && dataConnection.open === false) { return false}
          return true;
        },
        sendDataToPeer: function(dataToSend) {
            sendData(dataToSend);
        },
        callPeer: function (userToCall) {
            if (!me) {
                console.log("Warning! no peerjs connection")
            }

            getLocalStream(function (stream) {

                currentCallStream = me.call(userToCall.number, stream, { metadata: me.id});
                currentCallStream.on('error', function (err) {
                    endCurrentCall();

                });
                currentCallStream.on('stream', function(stream) {
                    console.log('going to stream from call')
                    setRemoteStreamSrc(stream);

                    $timeout(function() {
                         $state.go('call', {user: userToCall});
                     }, 500)

                });

                currentCallStream.on('close', function() {
                    endCallAndGoBack();
                });
            });

            var dataConn = me.connect(userToCall.number);

            setDataConnection(dataConn);

        },
        endCurrentCall: function() {
            endCurrentCall();
        },
        disconnectFromPeerJS: function() {
            disconnectFromPeerJS();
        }
    }
});
