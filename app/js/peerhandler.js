'use strict';

var peerhandler = angular.module('peerhandler', []);

peerhandler.factory('peerFactory', function($rootScope) {
    var me = null;

    return {
        getMe: function() {
            if (!me) {throw new Error('PeerJS connection not initialized!')}
            return me;
        },
        connectToPeerJS: function(id)   {
            me = new Peer(id, $rootScope.config.peerjs);
            me.on('open', function(id) {
                me.IsConnected = true;
                console.log('Connection opened: ' + id);
            });

            me.on('error', function(error) {
              me.isConnected = false;
              alert(error);
            });
        }
    }
});
