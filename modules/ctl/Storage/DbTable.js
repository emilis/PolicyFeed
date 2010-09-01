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

/*  
    Utility functions for managing data in one DB table.
 */

// Requirements:
var gluestick = require("gluestick");
var ringo_strings = require("ringo/utils/strings");

/**
 *
 */
exports.DB = false;


/**
 *
 */
exports.TABLENAME = false;


/**
 *
 */
exports.connect = function(db, table) {
    if (typeof(db) != "string" && db.get_all)
        this.DB = db;
    else
        this.DB = gluestick.loadModule(db);

    this.TABLENAME = table;
}


/**
 *
 */
exports.exists = function(id) {
    var sql = "select id from `" + this.TABLENAME + "` where id=?";
    var result = this.DB.get_one(this.DB.prepared_query(sql, [id]));
    return ( result === id );
}


/**
 *
 */
exports.read = function(id) {

    if ((typeof(id) == "object") && !(id instanceof String)) {
        return this.list(id, { limit: 1 })[0];
    }

    var sql = "select * from `" + this.TABLENAME + "` where id=?";
    var rs = this.DB.prepared_query(sql, [id]);
    var result = this.DB.get_row(rs);
    rs.getStatement().close();
    return result;
}


/**
 *
 */
exports.write = function(id, data) {
    if (!id || !this.exists(id)) {
        return this.create(id, data);
    } else {
        return this.update(id, data);
    }
}


/**
 *
 */
exports.create = function(id, data) {

    var fields = [];
    var values = [];
    for (var key in data) {
        fields.push(key);
        values.push(data[key]);
    }

    if (id && !data.id)
        data.id = id;

    var sql = "INSERT INTO `"
        + this.TABLENAME
        + "` (`" + fields.join("`,`") + "`) "
        + " VALUES(" + ringo_strings.repeat("?,", (values.length - 1)) + "?)";

    var rs = this.DB.prepared_query(sql, values);
    if (rs.getStatement)
        rs.getStatement().close();
    return rs;
}


/**
 *
 */
exports.update = function(id, data) {

    var fields = [];
    var values = [];
    for (var key in data) {
        fields.push(key);
        values.push(data[key]);
    }

    values.push(id);
    var sql = "UPDATE users SET `" + fields.join('`=?, `') + "`=? WHERE id=?";

    var rs = this.DB.prepared_query(sql, values);
    if (rs.getStatement)
        rs.getStatement().close();
    return rs;
}


/**
 *
 */
exports.remove = function(id) {
    var sql = "delete from `" + this.TABLENAME + "` where id=?";
    var rs = this.DB.prepared_query(sql, [id]);
    if (rs.getStatement)
        rs.getStatement().close();
    return rs;
}


/**
 *
 */
exports._select_query = function(filter, options) {

    filter = filter || {};
    options = options || {};
    var {sort, offset, limit} = options;


    var sql = "SELECT * FROM `" + this.TABLENAME + "` ";
    var values = [];

    if (Object.keys(filter).length) {
        sql += " WHERE ";
                var sep = "";
        for (var field in filter) {

            var value = filter[field];
            if (value instanceof Array) {
                sql += sep + field + " IN ('" + value.join("','") + "')";
            } else if (value instanceof RegExp) {
                sql += sep + field + " LIKE ?";
                values.push(value.toString().slice(1, -1));
            } else {
                sql += sep + field + "=?";
                values.push(filter[field]);
            }
            
            sep = " AND ";
        }
    }

    if (sort) {
        sep = "";
        sql += " ORDER BY ";
        for (var field in sort) {
            sql += sep + field + " " + sort[field];
            sep = ",";
        }
    }

    if (limit)
        sql += " LIMIT " + limit;
    if (offset)
        sql += " OFFSET " + offset;

    return this.DB.prepared_query(sql, values);
}


/**
 *
 */
exports.list = function(filter, options) {

    var rs = this._select_query(filter, options);
    var result = this.DB.get_all(rs) || [];
    rs.getStatement().close();
    return result;
}


/**
 *
 */
exports.iterate = function(filter, options) {

    var rs = this._select_query(filter, options);
    return this.DB.get_iterator(rs) || [];
}

