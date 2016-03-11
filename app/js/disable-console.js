(function () {
    'use strict';

    var console    = {};

    if (window.env.environment === 'production') {
        console.log    = function () {};
        console.error  = function () {};
        console.warn   = function () {};
        console.info   = function () {};
        window.console = console;
    }

}());

