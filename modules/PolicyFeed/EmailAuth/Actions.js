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
var ringo_strings = require("ringo/utils/strings");
var serializable = require("ctl/objectfs/serializable");

// Extend DB table driver::
gluestick.extendModule(exports, "ctl/objectfs/dbtable");

// Add serialization when reading/writing items:
exports.serialize = function(data) {
    data.params = uneval(data.params);
    if (data.time instanceof Date)
        data.time = data.time.getTime();
    return data;
}

exports.unserialize = function(data) {
    data.params = eval(data.params);
    data.time = new Date(data.time);
    return data;
}

serializable.upgradeExports(exports);



// Connect to db table:
exports.connect("DB_users", "unconfirmed");

/**
 *
 */
exports._actions_parent_create = exports.create;
exports.create = function(id, data) {
    id = id || ringo_strings.random(40);
    data.time = data.time || new Date();

    if (this._actions_parent_create(id, data)) {
        return id;
    } else {
        return false;
    }
}


/**
 *
 */
exports.remove_old = function() {
    var sql = "delete from `" + this.TABLENAME + "` where time<?";
    var rs = this.DB.prepared_query(sql, [new Date().getTime() - 24*3600*1000]);
    if (rs && rs.getStatement) {
        rs.getStatement().close();
    }
    return rs;
}
