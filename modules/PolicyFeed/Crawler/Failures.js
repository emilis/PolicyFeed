/*
    Copyright 2010,2011 Emilis Dambauskas

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
var config = require("config");
var gluestick = require("gluestick");
var serializable = require("ctl/objectfs/serializable");

// Create functions for this module and connect to a DB table:
gluestick.extendModule(exports, "ctl/objectfs/dbtable");
serializable.upgradeExports(exports);
exports.connect("DB_failures", "failures");

// Create a logger for this module:
var log = require("ringo/logging").getLogger(module.id);


/**
 * Fix field values and types before writing to database:
 */
exports.serialize = function(data) {

    // Default value for time and convert it to Number:
    data.time = data.time || new Date();
    if (data.time instanceof Date) {
        data.time = data.time.getTime();
    }

    // Create times counter if it does not exist:
    data.times = data.times || 1;

    // Make "data" field an object:
    data.data = data.data || {};
    if (typeof(data.data) == "string" || data.data instanceof String) {
        data.data = { data: data.data }; // Repeat after me... :-)
    }

    // Move all extra fields to data field:
    var new_data = {};
    var db_fields = ["url", "time", "times", "parser", "error", "data"];
    for each (var field_name in db_fields) {
        new_data[field_name] = data[field_name];
    }
    for each (var field_name in Object.keys(data)) {
        if (data.hasOwnProperty(field_name) && db_fields.indexOf(field_name) == -1) {
            new_data.data[field_name] = data[field_name];
        }
    }

    // Serialize data field:
    new_data.data = uneval(new_data.data);

    return new_data;
}


/**
 * Fix field values and types after reading from database:
 */
exports.unserialize = function(data) {

    data.time = new Date(data.time);
    if ((typeof(data.data) == "string") || (data.data instanceof String)) {
        data.data = eval(data.data);
    }

    return data;
}


/**
 *
 */
exports._parent_exists = exports.exists;
exports.exists = function(filter) {
    if (filter.indexOf && filter.indexOf("://") > -1) {
        filter = { url: filter };
    }

    return this._parent_exists(filter);
}


/**
 *
 */
exports._parent_read = exports.read;
exports.read = function(filter) {
    if (filter.indexOf && filter.indexOf("://") > -1) {
        filter = { url: filter };
    }

    return this._parent_read(filter);
}


/**
 *
 */
exports._parent_write = exports.write;
exports.write = function(id, data) {
    log.warn("write", data.url, uneval(data));

    var oldData = this.read(data.url);
    if (oldData) {
        data.times = oldData.times ? (oldData.times + 1) : data.times;
        return this._parent_write(oldData.id, data);
    } else {
        return this._parent_write(id, data);
    }
}


/**
 *
 */
exports._parent_remove = exports.remove;
exports.remove = function(filter, options) {
    if (filter.indexOf && filter.indexOf("://") > -1) {
        filter = { url: filter };
    }

    return this._parent_remove(filter);
}


/**
 * Imports failures from the old Berkeley database:
 */
exports.importOldDatabase = function() {
    old_db = {};
    gluestick.extendModule(old_db, "ctl/objectfs/berkeley");
    old_db.connect(config.DIRS.data + "/failures", "failures");

    for each (var item in old_db.list()) {
        log.info("importOldItem", uneval(item));

        if (!item.error && item.data && item.data.error) {
            item.error = item.data.error;
        }
        if (item.error == "Unregognized author") {
            item.error = "Unrecognized author";
        }

        this.write(false, item);
    }
}
