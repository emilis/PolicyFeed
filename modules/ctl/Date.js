/*
    Copyright 2010 Emilis Dambauskas

    This file is part of Cheap Tricks Library for RingoJS.

    Cheap Tricks Library is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Cheap Tricks Library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Cheap Tricks Library.  If not, see <http://www.gnu.org/licenses/>.
*/

var dates = require("ringo/utils/dates");

/**
 *
 */
exports.stringToArray = function(str) {
    var arr = str.trim().replace(/[- T:.Z]/g, "-").split("-").map(function (item) { return parseInt(item, 10); });
    
    for (var i=0;i<7;i++) {
        if (!arr[i])
            arr[i] = 0;
    }

    return arr;
}

/**
 * 
 */
exports.fromISOString = function(str) {

    if (str instanceof Date) {
        return str;
    } else {
        var arr = this.stringToArray(str);
        arr[1]--; // prepare month value
        return new Date(arr[0], arr[1], arr[2], arr[3], arr[4], arr[5], arr[6]);
    }
}


/**
 *
 */
exports.fromUTCString = function(str) {

    if (str instanceof Date) {
        return str;
    } else {
        var arr = this.stringToArray(str);
        arr[1]--; // prepare month value
        return new Date(Date.UTC(arr[0], arr[1], arr[2], arr[3], arr[4], arr[5], arr[6]));
    }

}


/**
 *
 */
exports.formatFromString = function(str, format) {
    if (!(str instanceof Date))
        str = this.fromISOString(str);
    return dates.format(str, format);
}
