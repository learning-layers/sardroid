'use strict';

/*
 * Gigantic factory whis is basically a wrapper around the PeerJS
 * WebRTC library. This one may be a bit hard to read unfortunately.
 * You should refer to the PeerJS docs if something is puzzling.
 */

var peerhandler = angular.module('peerhandler', []);

peerhandler.factory('peerFactory', function(configFactory, $rootScope, $ionicPopup, $ionicLoading, $ionicHistory, $timeout, $state, $translate, $cordovaLocalNotification, audioFactory, contactsFactory, modalFactory) {

    // PeerJS object representing the user
    var me                = null;

    // Object holding configuration variables
    var config            = configFactory.getValue('peerjs');

    // Stream objects;
    var localStream       = null;
    var remoteStream      = null;

    // Stream sources
    var remoteVideoSource = null;
    var localVideoSource  = null;

    var currentCallStream   = null;
    var currentAnswerStream = null;

    // Simple boolean flag to check if we're currently in a call
    var isInCallCurrently = false;

    // Flag for checking if we've connected succesfully during the current session at least once
    var hasConnectionEverSucceeded = false;

    // Seperate data connection for sending data
    var dataConnection = null;

    // Variable to store a reference to the reconnection setTimeout function
    var reconnectIntervalHandle = null;

    // How many times have we already tried to reconnect unsuccesfully
    var reconnectAttempts = 0;

    // In milliseconds, how long until the next reconnect attempt.
    var nextReconnectIn = 1000;

    // Scope for the reconnect loader pop-up
    var reconnectScope = $rootScope.$new(true);

    reconnectScope.reconnectTimer = function () {
        reconnectScope.countdown = nextReconnectIn / 1000;

        reconnectScope.countdownTimer = setInterval(function () {
            reconnectScope.countdown--;
            reconnectScope.$apply();
        }, 1000)
    };

    reconnectScope.stopTimer = function () {
        clearTimeout(reconnectScope.countdownTimer);
    };

    reconnectScope.forceReconnect = function () {
        if (me.destroyed === false ){
            me.reconnect();
        }
    };

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
    var getLocalStream = function(successCallback, errorCallback) {
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
                    errorCallback
                )
            })
        }
    };

    var cancelAllLocalNotifications = function() {
            notificationIds.map(function (id) {
                cancelLocalNotification(id);
            });
    };

    var cancelLocalNotification = function(id) {
        if (window.cordova) {
            $cordovaLocalNotification.cancel(id);
        }

        var index = notificationIds.indexOf(id);
        notificationIds.splice(index, 1);
    };

    var getCallbacksByType = function (type) {
        return _.where(dataCallbacks, { eventType: type });
    }

    var setRemoteStreamSrc = function (stream) {
        remoteStream = stream;
        remoteVideoSource = window.URL.createObjectURL(stream);
    };

    var setLocalStreamSrc = function (stream) {
        localVideoSource = window.URL.createObjectURL(stream);
    };

    var showCallLoader = function () {
        console.log('show loader')
        audioFactory.playSound('.dial');
        $ionicLoading.show({
            templateUrl: 'templates/modals/loader.html',
            duration: 10000
        });
    };

    var hideCallLoader = function () {
        console.log('hide loader')
        audioFactory.stopSound('.dial');
        $ionicLoading.hide();
    }

    // TODO: Make closing dataconnection more modular?
    var checkIfDataConnectionIsSet = function (incomingConnection) {
       if (typeof dataConnnection != 'undefined' || dataConnection != null) {
        incomingConnection.serialization = 'none';
        incomingConnection.reliable = true;

        incomingConnection.on('open', function () {
            incomingConnection.send(
                JSON.stringify({
                    type: 'connectionClose',
                    message: 'User is already in call!'
                })
            );
            incomingConnection.close();
            incomingConnection = null;
        })

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

                var dataJSON = JSON.parse(data);
                if (dataJSON.type == 'connectionClose') {
                    hideCallLoader();
                    callAlertModal(dataJSON.message);
                }
                else {
                    var callbackArray = getCallbacksByType(dataJSON.type)
                    if (callbackArray) {
                        var len = callbackArray.length;

                        for (var i = 0; i < len; i++) {
                            callbackArray[i].callback(data)
                        }
                    }
                }
        });

        dataConn.on('error', function(err) {
             console.log('dataconnection error!')
             console.log(err);
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
        isInCallCurrently = false;
        endCurrentCall();
        if ($state.current.name === "call") {
            $ionicHistory.goBack();
        }
    };

    var callAlertModal = function(reasonMessage) {

        modalFactory.alert('Call over!', reasonMessage)
        .then(function() {
            endCallAndGoBack();
        });

    };

    var answer = function(call) {
        return new Promise(function (resolve, reject) {

            currentAnswerStream = call;

            call.answer(localStream);

            call.on('stream', function (mediaStream) {
                setRemoteStreamSrc(mediaStream);
                resolve();
            })

            call.on('close', function() {
                endCallAndGoBack();
            });

            call.on('error', function(error) {
                reject();
                callAlertModal('Error: ' + error.toString());
            });

        })
    };

    var setupReconnectAttempts = function () {
        console.log('Setting up reconnect interval handle');
        reconnectIntervalHandle = $timeout(attemptReconnect, nextReconnectIn)

        reconnectScope.nextReconnectIn =  nextReconnectIn;

        reconnectScope.reconnectTimer();

        $ionicLoading.show({
            templateUrl: 'templates/modals/reconnect-loader.html',
            scope: reconnectScope
        });

    }

    var attemptReconnect = function () {

            if (me.destroyed === true) {
                stopReconnectAttempt({ failed: true });
                return;

            }

            if (me && me.disconnected === true && me.open === false ) {
                console.log('attempting to reconnect...');
                me.reconnect();
                reconnectAttempts = reconnectAttempts + 1;
                if (reconnectIntervalHandle !== null) {
                    nextReconnectIn = Math.pow(reconnectAttempts, 2) * 1000;
                    console.log('reconnecting in ', nextReconnectIn);
                    reconnectIntervalHandle = $timeout(attemptReconnect, nextReconnectIn);
                    reconnectScope.nextReconnectIn = nextReconnectIn;
                    reconnectScope.countdown = nextReconnectIn / 1000;
                } else {
                    console.log('timeout already set, fuck!');
                }
            } else {
                console.log('me is undefined or disconnected is true, stopping!');
                stopReconnectAttempt({ failed: false });
            }

            if (reconnectAttempts > 10) {
                console.log('Attempted to connect over 10 times, stopping');
                stopReconnectAttempt({ failed: true });
            }
    };

    var stopReconnectAttempt = function (opts) {
        reconnectScope.stopTimer();
        $timeout.cancel(reconnectIntervalHandle);
        reconnectIntervalHandle = null;
        reconnectAttempts       = 0;
        nextReconnectIn         = 1000;

        $ionicLoading.hide();

        if (opts.failed === true ){
            disconnectFromPeerJS();
            $state.go('login');
            modalFactory.alert($translate.instant('ERROR_TITLE'), $translate.instant('RECONNECT_FAILED'))
        }
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

        getRemoteStream: function() {
            return remoteStream;
        },

        getLocalStream: function() {
            return localStreamSrc;
        },

        isConnected: function() {
            if (!me) {return false}
            else {return !me.disconnected}
        },

        registerCallback: function (eventType, callback) {
            // Quick hack since callbacks seem to be registered twice at the moment
            if (getCallbacksByType(eventType).length === 0) {
                console.log('adding callback ' + eventType);
                dataCallbacks.push({
                   eventType: eventType,
                   callback: callback
                });
            }
        },

        clearCallback: function(type) {
            console.log('clearing data callback by type: ' + type);
            dataCallbacks = dataCallbacks.filter(function (cbo) {
                return cbo.eventType !== type;
            })
            console.log(dataCallbacks.length);
        },

        clearAllCallbacks: function() {
            dataCallbacks = [];
        },

        connectToPeerJS: function(id)   {
            var disconnectRef = this.disconnectFromPeerJS;

            return new Promise(function(resolve, reject) {

                if (me) {
                    me.disconnect()
                }

                me = new Peer(id, config);

                if (!me) {
                    alert('Error creating peer!');
                    reject();
                }

                me.on('connection', function(dataConn) {
                    console.log('dataconnetion received');
                    console.log(dataConn);
                    if (checkIfDataConnectionIsSet(dataConn) === false) {
                        setDataConnection(dataConn);
                    }
                });

                me.on('close', function() {
                    console.log('closed Peerjs connection');
                    reject();
                });

                me.socket._socket.onopen = function() {
                    getLocalStream(null, function (err) {
                        if (err.name == 'DevicesNotFoundError'){
                            modalFactory.alert($translate.instant('ERROR_TITLE'), $translate.instant('CAMERA_NOT_FOUND'));
                        }
                    });
                };

                me.on('error', function(error) {
                    var errorMsg = error.toString();

                    switch (error.type) {
                        case 'peer-unavailable':
                            errorMsg = $translate.instant('ERROR_USER_OFFLINE');
                        break;
                        case 'server-error':
                            errorMsg =  $translate.instant('ERROR_SERVER');
                        break;
                        case 'network':
                            errorMsg =  $translate.instant('ERROR_NETWORK');
                        break;
                    }

                    if (error.type === 'network' && me && hasConnectionEverSucceeded === true) {
                        if (reconnectAttempts === 0) {
                            setupReconnectAttempts();
                        }
                    } else {
                        hideCallLoader();
                        modalFactory.alert(
                            $translate.instant('ERROR_TITLE'),
                            errorMsg
                        )
                        .then(function(res) {
                            if (error.type == 'server-error' || error.type == 'network' ) {
                                disconnectRef();
                                $state.go('login');
                            }
                        });
                    }

                });

                me.on('call', function(mediaConnection) {
                    if (isInCallCurrently === false) {
                        isInCallCurrently = true;
                        audioFactory.playSound('.call');

                        console.log('call from ' + mediaConnection.peer);
                        var user = contactsFactory.getContactByNumber(mediaConnection.peer);
                        var id = Math.floor(Math.random() * 10000);
                        notificationIds.push(id);

                        if (!user) {
                            user = { displayName: mediaConnection.peer }
                        }

                        $cordovaLocalNotification.schedule({
                            id: id,
                            title: $translate.instant('NOTIFICATION_CALL', {displayName: user.displayName, mediaConnection: mediaConnection.peer}),
                            text: $translate.instant('NOTIFICATION_CALL', {displayName: user.displayName, mediaConnection: mediaConnection.peer}),
                        }).then(function (result) {
                            console.log(result);
                        });

                        var confirmPopup = $ionicPopup.confirm({
                            title: $translate.instant('CALL_INCOMING_TITLE', {displayName: user.displayName}),
                            template: $translate.instant('CALL_INCOMING_TEMPLATE')
                        });


                        confirmPopup.then(function(res) {

                            // TODO: Investigate why cancelling the sound fails unless in timeout
                            $timeout(function () {
                                audioFactory.stopAllSounds();
                            }, 100)

                            cancelLocalNotification(id);

                            if(res) {
                                answer(mediaConnection)
                                    .then(function () {
                                        $state.go('call', {user: user});
                                    })
                                    .catch(function (error) {
                                        alert(error)
                                    })
                            } else {
                                isInCallCurrently = false;
                                closeDataConnection('User is busy!');
                                mediaConnection.close();
                                return false;
                            }
                        });
                    } else {
                        console.log('ALready in call, closing media')
                        mediaConnection.close();
                    }
                });

                me.on('disconnected', function(id) {
                    console.log('Disconnected from PeerJS');
                });

                me.on('open', function(id) {
                    hasConnectionEverSucceeded = true
                    console.log('Connection opened: ' + id);
                    resolve();
                    stopReconnectAttempt({failed: false});
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
                console.log("Warning! no peerjs connection");
                return;
            }

            return new Promise(function (resolve, reject) {

                isInCallCurrently = true;

                showCallLoader();
                getLocalStream(function (stream) {

                    currentCallStream = me.call(userToCall.phoneNumber,  stream, { metadata: me.id});

                    currentCallStream.on('error', function (err) {
                        hideCallLoader();
                        isInCallCurrently = false;
                        alert(err);
                    });

                    currentCallStream.on('stream', function(stream) {
                        console.log('going to stream from call')
                        hideCallLoader();
                        console.log('audio tracks from stream');
                        console.log(stream.getAudioTracks());
                        setRemoteStreamSrc(stream);

                        resolve(userToCall);
                    });

                    currentCallStream.on('close', function() {
                        endCallAndGoBack();
                    });
                });

                var dataConn = me.connect(userToCall.phoneNumber, {reliable: true, serialization: "none"});

                if (checkIfDataConnectionIsSet(dataConn) === false) {
                    setDataConnection(dataConn);
                }
            })
        },

        endCurrentCall: function() {
            console.log('ending current call')
            isInCallCurrently = false;
            endCurrentCall();
        },

        disconnectFromPeerJS: function() {
            disconnectFromPeerJS();
        }
    }
});

