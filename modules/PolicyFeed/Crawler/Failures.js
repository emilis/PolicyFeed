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
var config = require("config");
var gluestick = require("gluestick");

// Extend module:
gluestick.extendModule(exports, "ctl/objectfs/berkeley");

// Connect to DB table:
exports.connect(config.DIRS.data, "failures");


var log = require("ringo/logging").getLogger(module.id);


/**
 *
 */
exports.exists = function(url) {
    return this.list({url: url}).length > 0;
}


/**
 *
 */
exports.read = function(url) {
    return this.list({url: url})[0];
}


/**
 *
 */
exports._parent_write = exports.write;
exports.write = function(url, data) {
    log.warn("write", url, uneval(data));

    data.url = data.url || url;
    data.time = data.time || new Date();
    data.times = data.times || 1;
    
    var oldData = this.read(url);
    if (oldData) {
        data.times = oldData.times ? (oldData.times + 1) : data.times;
        return this._parent_write(oldData._id, data);
    } else {
        return this._parent_write(false, data);
    }
}


/**
 *
 */
exports.remove = function(filter, options) {
    if (typeof(filter) == "string" || filter instanceof String) {
        filter = { url: filter };
    }

    return this.list(filter, options).map(function (item) { return item.remove(); });
}



