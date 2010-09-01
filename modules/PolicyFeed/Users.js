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

// Requirements:
var gluestick = require("gluestick");
var ringo_objects = require("ringo/utils/objects");
var ringo_strings = require("ringo/utils/strings");

// Extends:
gluestick.extendModule(exports, "ctl/Storage/DbTable");

// Configuration for ctl/DB/Table:
exports.connect("DB_users", "users");


/**
 *
 */
exports.emailExists = function(email) {
    return this.list({email: email}).length;
}


/**
 *
 */
exports.getByEmail = function(email) {
    return this.read({email: email});
}

/**
 *
 */
exports.getByKey = function(key) {
    return this.read({key: key});
}


/**
 *
 */
var parent_create = ringo_objects.clone(exports.create);
exports.create = function(id, data) {
    if (!data.key) {
        data.key = ringo_strings.random(40);
    }
    return parent_create(id, data);
}


