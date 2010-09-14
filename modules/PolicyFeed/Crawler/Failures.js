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

// Extend module:
gluestick.extendModule(exports, "ctl/objectfs/dbtable");

// Connect to DB table:
exports.connect("DB_urls", "failures");


var log = require("ringo/logging").getLogger(module.id);


/**
 *
 */
exports.serializeFields = function(data) {
    data.time = data.time || new Date().getTime();
    if (data.time instanceof Date) {
        data.time = data.time.getTime();
    }
    if (typeof(data.data) == "object") {
        data.data = uneval(data.data);
    }
    return data;
}


/**
 *
 */
exports.unserializeFields = function(data) {
    try {
        data.data = eval(data.data);
    } catch (e) {
        data.data = {};
    }
    data.time = new Date(data.time);
    return data;
}


/**
 *
 */
exports._parent_create = exports.create;
exports.create = function(id, data) {
    log.warn("create", uneval(data));
    data = this.serializeFields(data);
    return this._parent_create(id, data);
}


/**
 *
 */
exports._parent_update = exports.update;
exports.update = function(id, data) {
    data = this.serializeFields(data);
    return this._parent_update(id, data);
}


/**
 *
 */
exports._parent_list = exports.list;
exports.list = function(filter, options) {
    return this._parent_list(filter, options).map(function (item) {
            return exports.unserializeFields(item);
            });
}
