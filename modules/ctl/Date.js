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


/**
 * 
 */
Object.defineProperty(Date.prototype, "fromISOString", {
    value: function (str) {

        if (!str.match(/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\.?\d*Z$/))
            throw Error("Not an ISO date format: " + str + ".");

        this.setUTCFullYear(str.substr(0, 4));
        this.setUTCMonth(parseInt(str.substr(5, 2), 10) - 1);
        this.setUTCDate(str.substr(8, 2));
        this.setUTCHours(str.substr(11, 2));
        this.setUTCMinutes(str.substr(14, 2));
        this.setUTCSeconds(str.substr(17, 2));

        if (str.length > 21) {
            this.setUTCMilliseconds( str.substr(20, str.length - 21).pad("0", 3).substr(0, 3) );
            }
    }, writable: true
});

