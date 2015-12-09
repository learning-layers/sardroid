'use strict';

var peerhandler = angular.module('peerhandler', ['ngCordova' ]);

peerhandler.factory('peerFactory', function($rootScope, $ionicPopup, $ionicHistory, $state, $timeout, $cordovaLocalNotification, audioFactory, contactsFactory) {
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

    // Array of callback functions to handle data
    var dataCallbacks   = [];

    // Array of ids for local notifications that are shown to the user
    var notificationIds = [];

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

    var cancelAllLocalNotifications = function() {
            notificationIds.map(function (id) {
                console.log(id);
                cancelLocalNotification(id);
            });
    };

    var cancelLocalNotification = function(id) {
        $cordovaLocalNotification.cancel(id);
        var index = notificationIds.indexOf(id);
        notificationIds.splice(index, 1);
    }

    var setRemoteStreamSrc = function (stream) {
        remoteVideoSource = window.URL.createObjectURL(stream);
    };

    var setLocalStreamSrc = function (stream) {
        localVideoSource = window.URL.createObjectURL(stream);
    };

    // TODO: Make closing dataconnection more modular?
    var checkIfDataConnectionIsSet = function (incomingConnection) {
       if (typeof dataConnnection != 'undefined' || dataConnection != null) {
        incomingConnection.send(
            JSON.stringify({
                type: 'connectionClose',
                message: 'User is already in call!'
            })
        );
        incomingConnection.close();
        incomingConnection = null;

        return true;
       }
       else {
        return false;
       }
    };

    var setDataConnection = function(dataConn) {
        dataConn.serialization = 'none';
        dataConn.reliable = true;

        dataConn.on('open', function() {
            console.log('Dataconnection opened')
            dataConn.on('data', function(data) {
                console.log('data received!');
                console.log(data);

                var dataJSON = JSON.parse(data);
                if (dataJSON.type == 'connectionClose') {
                    callAlertModal(dataJSON.message);
                }
                else {
                     dataCallbacks.map(function (cb) {
                        cb(data);
                     });
                }
        });

        dataConn.on('error', function(err) {
             console.log('dataconnection error!')
             console.log(err);
             alert(err);
         });

        dataConn.on('close', function() {
            console.log('dataconn closed')
        });

        dataConnection = dataConn;
        })
    };

    var sendData = function(data) {

        if (typeof data != 'string') {
                data = JSON.stringify(data);
         }
        if (dataConnection) {
            dataConnection.send(data);
        }
        else {
            console.log('uhoh! data was null')
        }
    }

    var closeDataConnection = function(reason) {
        console.log('closing data connection')
      if (dataConnection) {
        if (reason) {
            sendData({
                type:    'connectionClose',
                message: reason
            });
        }
        dataConnection.close();
        dataConnection = null;
      }
    };

    var endCallAndGoBack = function() {
        console.log('end call and go back!');
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
        cancelAllLocalNotifications();
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
            console.log("Disconnecting from PeerJS")
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
        addDatacallback: function (callback) {
            dataCallbacks.push(callback);
        },
        removeDatacallbacks: function() {
            console.log('removing data callbacks from peerfactory');
            dataCallbacks = [];
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
                    var user = contactsFactory.getContactByNumber(mediaConnection.peer);
                    var id = Math.floor(Math.random() * 10000);
                    notificationIds.push(id);

                    if (!user) {
                        user = { displayName: mediaConnection.peer }
                    }

                    $cordovaLocalNotification.schedule({
                        id: id,
                        title: 'SAR Call from ' + user.displayName + ' (' + mediaConnection.peer + ')',
                        text: 'SAR Call from ' + user.displayName + ' (' + mediaConnection.peer + ')'
                    }).then(function (result) {
                        console.log(result);
                    });

                    var confirmPopup = $ionicPopup.confirm({
                        title: 'Call from ' + user.displayName,
                        template: 'Incoming call. Answer?'
                    });
                    audioFactory.playSound('.call');
                    confirmPopup.then(function(res) {
                        audioFactory.stopSound('.call');
                        cancelLocalNotification(id);
                        if(res) {
                            answer(mediaConnection);
                            $timeout(function() {
                                $state.go('call', {user: user});
                            }, 500)
                        } else {
                            closeDataConnection('User is busy!');
                            mediaConnection.close();
                            return false;
                        }
                    });
                });

                me.on('connection', function(dataConn) {
                    if (checkIfDataConnectionIsSet(dataConn) === false) {
                        setDataConnection(dataConn);
                    }
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
            console.log(typeof dataToSend);
            sendData(dataToSend);
        },
        callPeer: function (userToCall) {
            if (!me) {
                console.log("Warning! no peerjs connection")
            }

            getLocalStream(function (stream) {

                currentCallStream = me.call(userToCall.number, stream, { metadata: me.id});
                
                currentCallStream.on('error', function (err) {
                    alert(err);
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

            var dataConn = me.connect(userToCall.number, {reliable: true, serialization: "none"});

            setDataConnection(dataConn);

        },
        endCurrentCall: function() {
            console.log('ending current call')
            endCurrentCall();
        },
        disconnectFromPeerJS: function() {
            disconnectFromPeerJS();
        }
    }
});

