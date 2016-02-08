(function() {
    'use strict';
    if (window.env.environment === 'production') {
        var console   = {}
        console.log   = function () {}
        console.error = function () {}
        console.warn  = function () {}
        console.info  = function () {}
    }
})();
