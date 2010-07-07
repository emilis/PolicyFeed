/*
    Copyright 2010 Emilis Dambauskas

    This file is part of PolicyFeed module.

    PolicyFeed is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    PolicyFeed is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with PolicyFeed.  If not, see <http://www.gnu.org/licenses/>.
*/


var JsonStorage = require("ctl/JsonStorage");

var DB = "data/PolicyFeed/ErrorManager";


/**
 * Minutes to delay
 */
var delays = [1,2,5,10,30,60];

/**
 *
 */
var errors = [];


/**
 *
 */
exports.init = function() {
    errors = JsonStorage.read(DB);
}


/**
 *
 */
exports.save = function() {
    JsonStorage.write(DB, errors);
}


/**
 *
 */
exports.addError = function(e) {
    errors.push(e);
    this.save();
    return e;
}


/**
 *
 */
exports.getErrorList = function() {
    return errors;
}


/**
 *
 */
exports.removeError = function(e) {
    errors.remove(e);
    this.save();
    return e;
}
