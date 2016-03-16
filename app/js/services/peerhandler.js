'use strict';

/*
 * Gigantic factory whis is basically a wrapper around the PeerJS
 * WebRTC library. This one may be a bit hard to read unfortunately.
 * You should refer to the PeerJS docs if something is puzzling.
 */

angular.module('peerhandler', [])
.factory('peerFactory', function (configFactory, $log, $window, $rootScope, $ionicPopup, $ionicLoading, $ionicHistory,
                                  $timeout, $state, $translate, $cordovaLocalNotification, audioFactory,
                                  contactsFactory, modalFactory) {
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

    var callUserScope = $rootScope.$new(true);

    var stopCallAttempt = function () {
        closeDataConnection({ type: 'callerClosed', message: 'User changed his mind!' });
    };

    // Array of callback functions to handle data
    var dataCallbacks   = [];

    // Array of ids for local notifications that are shown to the user
    var notificationIds = [];

    // Get a suitable camera for video (first choice is backwards-facing camera)
    var getDeviceCameraID = function () {
        return new Promise(function (resolve, reject) {
            var first = false;
            var back  = false;

            MediaStreamTrack.getSources(function (src) {
                var i;

                if (!src) {
                    reject('No sources found!');
                }

                for (i in src) {
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
        });
    };

    // Private api
    var getLocalStream = function (successCallback, errorCallback) {
        if (localStream && successCallback) {
            successCallback(localStream);
        } else {
            getDeviceCameraID().then(function (id) {
                var videoSettings = {};

                if (id) {
                    videoSettings.optional = [{ sourceId: id }];
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
                );
            });
        }
    };

    var cancelAllLocalNotifications = function () {
        notificationIds.forEach(function (id) {
            cancelLocalNotification(id);
        });

        notificationIds = [];
    };

    var cancelLocalNotification = function (id) {
        var index = notificationIds.indexOf(id);

        if ($window.cordova) {
            $cordovaLocalNotification.cancel(id);
        }

        notificationIds.splice(index, 1);
    };

    var getCallbacksByType = function (type) {
        return _.where(dataCallbacks, { eventType: type });
    };

    var setRemoteStreamSrc = function (stream) {
        remoteStream      = stream;
        remoteVideoSource = $window.URL.createObjectURL(stream);
    };

    var setLocalStreamSrc = function (stream) {
        localVideoSource = $window.URL.createObjectURL(stream);
    };

    var showCallLoader = function () {
        audioFactory.loopSound('dial');
        $ionicLoading.show({
            templateUrl: 'templates/modals/call-loader.html',
            scope: callUserScope
        });
    };

    var hideCallLoader = function () {
        audioFactory.stopSound('dial');
        $ionicLoading.hide();
    };

    // TODO: Make closing dataconnection more modular?
    var checkIfDataConnectionIsSet = function (incomingConnection) {
        if (dataConnection !== null) {
            incomingConnection.serialization = 'none';
            incomingConnection.reliable = true;

            incomingConnection.on('open', function () {
                incomingConnection.send(
                    angular.toJson({
                        type    : 'connectionClose',
                        message : 'User is already in call!'
                    })
                );
                incomingConnection.close();
                incomingConnection = null;
            });
            return true;
        }
        return false;
    };

    var setDataConnection = function (dataConn) {
        dataConn.serialization = 'json';
        dataConn.reliable = true;

        dataConn.on('open', function () {
            dataConn.on('data', function (incomingData) {
                var dataJSON      = angular.fromJson(incomingData);
                var callbackArray = getCallbacksByType(dataJSON.type);
                var len           = callbackArray.length;
                var i;

                if (dataJSON.type === 'connectionClose') {
                    hideCallLoader();
                    callAlertModal(dataJSON.message);
                } else if (dataJSON.type === 'callerClosed') {
                    cancelAllLocalNotifications();
                    modalFactory.closeAllPopups();
                    closeDataConnection();
                    isInCallCurrently = false;
                } else {
                    if (callbackArray) {
                        for (i = 0; i < len; i++) {
                            callbackArray[i].callback(incomingData);
                        }
                    }
                }
            });

            dataConn.on('error', function (err) {
                $log.log('dataconnection error!');
                $log.log(err);
            });

            dataConn.on('close', function () {
                $log.log('dataconn closed');
            });

            dataConnection = dataConn;
        });
    };

    var sendData = function (dataToSend) {
        if (dataConnection) {
            dataConnection.send(dataToSend);
        } else {
            $log.log('uhoh! data was null');
        }
    };

    var closeDataConnection = function (opts) {
        if (typeof opts !== 'undefined' && typeof opts.type === 'undefined') {
            opts.type = 'connectionClose';
        }

        if (dataConnection) {
            if (typeof opts !== 'undefined') {
                sendData(opts);
            }

            dataConnection.close();
            dataConnection = null;
        }
    };

    var endCallAndGoBack = function () {
        $log.log('end call and go back!');
        isInCallCurrently = false;
        endCurrentCall();

        if ($state.current.name === 'call') {
            $ionicHistory.goBack();
        }
    };

    var callAlertModal = function (reasonMessage) {
        modalFactory.alert('Call over!', reasonMessage)
        .then(function () {
            endCallAndGoBack();
        });
    };

    var answer = function (call) {
        return new Promise(function (resolve, reject) {
            currentAnswerStream = call;

            call.answer(localStream);

            call.on('stream', function (mediaStream) {
                setRemoteStreamSrc(mediaStream);
                resolve();
            });

            call.on('close', function () {
                endCallAndGoBack();
            });

            call.on('error', function (error) {
                reject();
                callAlertModal('Error: ' + error.toString());
            });
        });
    };

    var setupReconnectAttempts = function () {
        $log.log('Setting up reconnect interval handle');
        reconnectIntervalHandle = $timeout(attemptReconnect, nextReconnectIn);

        reconnectScope.nextReconnectIn =  nextReconnectIn;

        reconnectScope.reconnectTimer();

        $ionicLoading.show({
            templateUrl: 'templates/modals/reconnect-loader.html',
            scope: reconnectScope
        });
    };

    var attemptReconnect = function () {
        if (me.destroyed === true) {
            stopReconnectAttempt({ failed: true });
            return;
        }

        if (me && me.disconnected === true && me.open === false) {
            $log.log('attempting to reconnect...');
            me.reconnect();
            reconnectAttempts = reconnectAttempts + 1;
            if (reconnectIntervalHandle !== null) {
                nextReconnectIn = Math.pow(reconnectAttempts, 2) * 1000;
                $log.log('reconnecting in ', nextReconnectIn);
                reconnectIntervalHandle = $timeout(attemptReconnect, nextReconnectIn);
                reconnectScope.nextReconnectIn = nextReconnectIn;
                reconnectScope.countdown = nextReconnectIn / 1000;
            } else {
                $log.log('timeout already set, fuck!');
            }
        } else {
            $log.log('me is undefined or disconnected is true, stopping!');
            stopReconnectAttempt({ failed: false });
        }

        if (reconnectAttempts > 10) {
            $log.log('Attempted to connect over 10 times, stopping');
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

        if (opts.failed === true) {
            disconnectFromPeerJS();
            $state.go('login');
            modalFactory.alert($translate.instant('ERROR_TITLE'), $translate.instant('RECONNECT_FAILED'));
        }
    };

    var endCurrentCall = function () {
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

    var disconnectFromPeerJS = function () {
        if (me) {
            me.disconnect();
            me.destroy();
            me = null;
            endCurrentCall();
        }
    };

    reconnectScope.reconnectTimer = function () {
        reconnectScope.countdown = nextReconnectIn / 1000;

        reconnectScope.countdownTimer = setInterval(function () {
            reconnectScope.countdown--;
            reconnectScope.$apply();
        }, 1000);
    };

    reconnectScope.stopTimer = function () {
        clearTimeout(reconnectScope.countdownTimer);
    };

    // Force a new reconnect attempt on button press
    reconnectScope.forceReconnect = function () {
        if (me.destroyed === false) {
            me.reconnect();
        }
    };

    callUserScope.cancelCalling = function () {
        stopCallAttempt();
        hideCallLoader();
    };


    // Public PeerJS api
    return {
        getMe: function () {
            if (!me) {
                return null;
            }
            return me;
        },

        getRemoteStreamSrc: function () {
            if (!remoteVideoSource) {
                $log.log('No video remote source!');
                return null;
            }

            return remoteVideoSource;
        },

        getLocalStreamSrc: function () {
            if (!localVideoSource) {
                return null;
            }

            return localVideoSource;
        },

        getRemoteStream: function () {
            return remoteStream;
        },

        isConnected: function () {
            if (!me) {
                return false;
            }

            return !me.disconnected;
        },

        registerCallback: function (eventType, callback) {
            // Quick hack since callbacks seem to be registered twice at the moment
            if (getCallbacksByType(eventType).length === 0) {
                $log.log('adding callback ' + eventType);
                dataCallbacks.push({
                    eventType: eventType,
                    callback: callback
                });
            }
        },

        toggleAudioStream: function () {
            var audioTracks;

            if (localStream) {
                audioTracks = localStream.getAudioTracks();
                audioTracks.forEach(function (a) {
                    a.enabled = !a.enabled;
                });
            }
        },

        toggleVideoStream: function () {
            var videoTracks;
            if (localStream) {
                videoTracks = localStream.getVideoTracks();
                videoTracks.forEach(function (v) {
                    v.enabled = !v.enabled;
                });
            }
        },

        clearCallback: function (type) {
            dataCallbacks = dataCallbacks.filter(function (cbo) {
                return cbo.eventType !== type;
            });
        },

        clearAllCallbacks: function () {
            dataCallbacks = [];
        },

        connectToPeerJS: function (id)   {
            var disconnectRef = this.disconnectFromPeerJS;

            return new Promise(function (resolve, reject) {
                if (me) {
                    me.disconnect();
                }

                me = new Peer(id, config);

                if (!me) {
                    reject();
                }

                me.on('connection', function (dataConn) {
                    if (checkIfDataConnectionIsSet(dataConn) === false) {
                        setDataConnection(dataConn);
                    }
                });

                me.on('close', function () {
                    $log.log('closed Peerjs connection');
                    reject();
                });

                me.socket._socket.onopen = function () {
                    getLocalStream(null, function (err) {
                        if (err.name === 'DevicesNotFoundError') {
                            modalFactory.alert($translate.instant('ERROR_TITLE'),
                                               $translate.instant('CAMERA_NOT_FOUND'));
                        }
                    });
                };

                me.on('error', function (error) {
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
                        .then(function () {
                            if (error.type === 'server-error' || error.type === 'network') {
                                disconnectRef();
                                $state.go('login');
                            }
                        });
                    }
                });

                me.on('call', function (mediaConnection) {
                    var user;
                    var notificationsId;
                    var notificationText;

                    if (isInCallCurrently === false) {
                        isInCallCurrently = true;
                        audioFactory.loopSound('call');

                        user = contactsFactory.getContactByNumber(mediaConnection.peer);

                        notificationsId = Math.floor(Math.random() * 10000);
                        notificationIds.push(notificationsId);

                        if (!user) {
                            user = { displayName: mediaConnection.peer };
                        }

                        notificationText = $translate.instant('NOTIFICATION_CALL',
                                                              { displayName: user.displayName,
                                                                mediaConnection: mediaConnection.peer });

                        $cordovaLocalNotification.schedule({
                            id    : notificationsId,
                            title : notificationText,
                            text  : notificationText
                        });

                        modalFactory.confirm(
                             $translate.instant('CALL_INCOMING_TITLE', { displayName: user.displayName }),
                             $translate.instant('CALL_INCOMING_TEMPLATE')
                        )
                        .then(function (res) {
                            audioFactory.stopSound('call');
                            cancelLocalNotification(id);

                            if (res) {
                                answer(mediaConnection)
                                .then(function () {
                                    $state.go('call', { user: user });
                                })
                                .catch(function (error) {
                                    $log.log(error);
                                });
                            } else {
                                isInCallCurrently = false;
                                closeDataConnection({ type: 'connectionClose', message: 'User is busy!' });
                                mediaConnection.close();
                            }
                        });
                    } else {
                        mediaConnection.close();
                    }
                });

                me.on('disconnected', function () {
                    $log.log('Disconnected from PeerJS');
                });

                me.on('open', function (openedId) {
                    hasConnectionEverSucceeded = true;
                    $log.log('Connection opened: ' + openedId);
                    resolve();
                    stopReconnectAttempt({ failed: false });
                });
            });
        },

        isDataConnectionOpen: function () {
            if (dataConnection === null && dataConnection.open === false) {
                return false;
            }

            return true;
        },

        sendDataToPeer: function (dataToSend) {
            sendData(dataToSend);
        },

        callPeer: function (userToCall) {
            return new Promise(function (resolve, reject) {
                var dataConn;

                if (!me) {
                    $log.log('Warning! no peerjs connection');
                    return;
                }

                isInCallCurrently = true;
                showCallLoader();

                getLocalStream(function (stream) {
                    currentCallStream = me.call(userToCall.phoneNumber,  stream, { metadata: me.id });

                    currentCallStream.on('error', function (err) {
                        reject(err);
                        $log.log(err);
                        hideCallLoader();
                        isInCallCurrently = false;
                    });

                    currentCallStream.on('stream', function (incomingRemoteStream) {
                        hideCallLoader();
                        setRemoteStreamSrc(incomingRemoteStream);
                        resolve(userToCall);
                    });

                    currentCallStream.on('close', function () {
                        reject();
                        endCallAndGoBack();
                    });
                });

                dataConn = me.connect(userToCall.phoneNumber, { reliable: true, serialization: 'none' });

                if (checkIfDataConnectionIsSet(dataConn) === false) {
                    setDataConnection(dataConn);
                }
            });
        },

        endCurrentCall: function () {
            isInCallCurrently = false;
            endCurrentCall();
        },

        disconnectFromPeerJS: function () {
            disconnectFromPeerJS();
        }
    };
});

