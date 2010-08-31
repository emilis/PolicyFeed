/*
    Copyright 2009,2010 Emilis Dambauskas

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

var gluestick = require("gluestick");

// Extends ./List.js:
gluestick.extendModule(exports, "ctl/DataObject/List");

exports._constructor = function()
{
    this.dataObject = this.newDataObject();
}

exports.getTableName = function()
{
    return this.dataObject._tableName;
}

exports.getDb = function()
{
    return this.dataObject.getDb();
}


exports.select = function(where, order)
{
    var sql = "select * from `" + this.getTableName() + "` ";

    if (where)
        sql += this.getWhereSql(where);

    if (order)
        sql += this.getOrderBySql(order);

    return this.query(sql, where);
}

exports.query = function(sql, params)
{
    var db = this.getDb();

    // convert params to array:
    if (!(params instanceof Array))
    {
        var p = params;
        params = new Array();
        for (var i in p)
            params.push(p[i]);
    }

    var rs = db.prepared_query(sql, params);
    if (!rs || !rs.first())
        throw StopIteration;

    rs.beforeFirst();

    try
    {
        while (rs.next())
        {
            var doc = this.newDataObject();
            doc.assignFields(db.get_row(rs));
            yield doc;
        }
    }
    finally
    {
        rs.getStatement().close();
    }
}

exports.assignRecord = function(data, pos)
{
    this.list[pos] = this.newDataObject();
    this.list[pos].assignFields(data);
}


/**
 *
 */
exports.getWhereSql = function(where, prefix)
{
    if (prefix == undefined)
        prefix = "WHERE";

    var sql = " ";
    for (field in where)
    {
        sql += prefix + "`" + field + "`";
        sql += " = ? ";

        prefix = " AND ";
    }
    return sql;
}


/**
 *
 */
exports.getOrderBySql = function(order)
{
    if (typeof(order) != "object")
        return "";
    else
    {
        var sql = " ORDER BY ";
        var separator = "";

        for (field in order)
        {
            sql += separator + " " + field + " " + order[field];
            separator = ",";
        }
        return sql;
    }
}

