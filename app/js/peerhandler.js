'use strict';

var peerhandler = angular.module('peerhandler', []);

peerhandler.factory('peerFactory', function($rootScope, $ionicPopup, $state) {
    var me               = null;
    var localStream       = null;
    var remoteVideoSource = null;

    // Privare api
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
        isConnected: function() {
            if (!me) {return false}
            else {return !me.disconnected}
        },
        connectToPeerJS: function(id)   {
            me = new Peer(id, $rootScope.config.peerjs);

            me.on('open', function(id) {
                console.log('Connection opened: ' + id);
            });

            me.on('call', function(mediaConnection) {
              console.log('Somebody callin');
                console.log(mediaConnection);
            });

            me.on('connection', function(dataConnection) {
                console.log('dataconnection formed!')
                console.log(dataConnection);
            });

            me.socket._socket.onopen = function() {
              getLocalStream();
            };

            me.on('error', function(error) {
              var errorAlert = $ionicPopup.alert({
                  title: 'Something went wrong!',
                  template: error.toString()
              });
             errorAlert.then(function(res) {
                  $state.go('login');
              });
            });
        },
        callPeer: function (callToId) {
            if (!me) return;

            getLocalStream(function (stream) {
                var call = me.call(callToId, stream, {name: me.id})
                call.on('error', function (err) {
                    console.log('Call error');
                });

                call.on('stream', setRemoteStreamSrc);
            });

        },

        answer: function(call) {
            console.log('incoming Call!');
            call.answer(localStream);
        },

        disconnectFromPeerJS: function() {
            me.disconnect();
        }
    }
});
