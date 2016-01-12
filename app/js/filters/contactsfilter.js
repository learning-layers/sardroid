'use strict';

// Filter to format a phone number to a more readable on
// eg 35840123456 becomes +358 40 123456
angular.module('contacts').filter('formatNumber', function () {
    return function (number) {
        var arr = number.split('')
         arr.splice(0, 0, '+')
         arr.splice(4, 0, ' ')
         arr.splice(7, 0, ' ')
        return arr.join(''); 
    };
});

