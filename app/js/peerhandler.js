'use strict';

var peerhandler = angular.module('peerhandler', []);

peerhandler.factory('peerFactory', function($rootScope, $ionicPopup, $state) {
    var me = null;

    return {
        getMe: function() {
            if (!me) {return null;}
            return me;
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
        disconnectFromPeerJS: function() {
            me.disconnect();
        }
    }
});
