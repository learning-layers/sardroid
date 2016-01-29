(function() {
    'use strict';
    if (window.env.environment === 'production') {
        var console = {}
        console.log = function () {}
        window.console = console;
    }
})();
