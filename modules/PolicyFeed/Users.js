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

module.shared = true;

var config = require("config");

var DB = loadObject("DB_users");


/**
 *
 */
exports.exists = function(id) {
    return this.read(id);
}


/**
 *
 */
exports.emailExists = function(email) {
    return this.select({email: email}).length;
}


/**
 *
 */
exports.read = function(id) {
    return this.select_one({id: id});
}


/**
 *
 */
exports.select = function(filter, sort) {
    var sql = "select * from users where ";
    var values = [];
    var sep = "";
    for (var field in filter) {

        if (filter[field] instanceof Array) {
            sql += sep + field + " IN ('" + filter[field].join("','") + "')";
        } else {
            sql += sep + field + "=?";
            values.push(filter[field]);
        }
        
        sep = " AND ";
    }

    if (sort) {
        sep = "";
        sql += " ORDER BY ";
        for (var field in sort) {
            sql += sep + field + " " + sort[field];
            sep = ",";
        }
    }

    var result = [];
    var rs = DB.prepared_query(sql, values);
    print(rs, sql, values);
    if (rs) {
        result = DB.get_all(rs) || [];
        rs.getStatement().close();
    }
    return result;
}


/**
 *
 */
exports.select_one = function(filter, sort) {
    var rows = this.select(filter, sort);
    if (rows)
        return rows[0];
    else
        return rows;
}


/**
 *
 */
exports.getByEmail = function(email) {
    return this.select_one({email: email});
}

/**
 *
 */
exports.getByKey = function(key) {
    return this.select_one({key: key});
}


/**
 *
 */
exports.write = function(id, data) {
    var fields = [];
    var values = [];
    for (var key in data) {
        fields.push(key);
        values.push(data[key]);
    }

    if (!this.exists(id)) {
        if (!data.key) {
            fields.push("key");
            values.push(String.random(40));
        }
        var sql = "INSERT INTO users (`" + fields.join("`,`") + "`) VALUES(" + "?,".repeat(values.length - 1) + "?)";
    } else {
        values.push(id);
        var sql = "UPDATE users SET `" + fields.join('`=?, ') + "`=? WHERE id=?";
    }

    var rs = DB.prepared_query(sql, values);
    if (rs) {
        if (rs.getStatement) {
            rs.getStatement().close();
            return true;
        } else {
            return rs;
        }
    }
}


