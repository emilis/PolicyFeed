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

var config = require("config");
var fs = require("fs");

var file_name = config.DIRS.data + "/SimpleSequence.txt";

var current = 0;
var fs_sync = 10;
var counter = fs_sync + 1;

/**
 *
 */
exports.next = function() {
    if (counter < fs_sync) {
        current++;
        counter++;
    } else if (!fs.exists(file_name)) {
        this.setValue( current );
    } else {
        this.setValue( parseInt(fs.read(file_name), 10) );
    }

    return current;
}


/**
 *
 */
exports.setValue = function(value) {
    fs.write(file_name, value + fs_sync);
    current = value;
    counter = 1;
}
