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
var Events = gluestick.loadModule("Events");


// Extends ../DataObject.js:
gluestick.extendModule(exports, "ctl/DataObject");

// --- Attributes: ---
exports._db = false;
exports._tableName = false;

// --- Methods: ---

/**
 * Returns MySQL database instance.
 * @return java.sql.Connection
 */
exports.getDb = function()
{
    if (!this._db)
        this._db = gluestick.loadModule("DB");
    return this._db;
}


/**
 * Gets field names from a database table metadata.
 * @return Array
 */
exports.getFieldNames = function()
{
    if (!this._fieldNames || this._fieldNames.length < 1)
    {
        this._fieldNames = new Array();
        var meta = this.getDb().connect().getMetaData();
        var rsColumns = meta.getColumns(null, null, this._tableName, null);
        while (rsColumns.next())
            this._fieldNames.push( rsColumns.getString("COLUMN_NAME") );
    }
    
    return this._fieldNames;
}


/**
 * @return Boolean
 */
exports.read = function(id)
{
    if (!id)
        id = this.id;

    var sql = "select * from " + this._tableName + " where id=?";
    var rs = this.getDb().prepared_query(sql, [id]);
    if (rs.first())
    {
        this.assignFields(this.getDb().get_row(rs));
        rs.getStatement().close();
        return true;
    }
    else
    {
        this.assignFields({});
        return false;
    }
}


/**
 * @return Boolean
 */
exports.save = function()
{
    Events.create(this._tableName + ":save", this.toObject());
    try {
        if (this.exists())
            return this.update();
        else
            return this.insert();
    } catch (err) {
        Events.create(this._tableName + ":save-error", err);
    }
}


/**
 * @return Boolean
 */
exports.exists = function()
{
    if (!this.id)
        return false;
    else
    {
        var sql = "select `id` from `" + this._tableName + "` where `id`=?";
        var rs = this.getDb().prepared_query(sql, [this.id]);

        var result = rs.first();
        rs.getStatement().close();
        return result;
    }
}


/**
 * @return java.sql.ResultSet or false on failure.
 */
exports.insert = function()
{
    if (!this.id)
        this.id = this.uniqid();

    var sql = "insert into `"
        + this._tableName
        + "` (`"
        + this.getFieldNames().join("`,`")
        + "`) values("
        + "?,".repeat(this.getFieldNames().length - 1)
        + "?)";

    return this.getDb().prepared_query(sql, this.toArray());
}


/**
 * @return java.sql.ResultSet or false on failure.
 */
exports.update = function()
{
    var sql = "update `"
        + this._tableName
        + "` set `";
        + this.getFieldNames().join("`=?,`");
        + "`=? WHERE `id`=?";

    var data = this.toArray();
    data.push(this.id);

    return this.getDb().prepared_query(sql, data);
}


/**
 * @return java.sql.ResultSet or false on failure.
 */
exports.remove = function(id)
{
    if (!id)
        id = this.id;

    var sql = "delete from `" + this._tableName + "` where `id`=?";

    return this.getDb().prepared_query(sql, [id]);
}


/**
 * @return Number
 */
exports.uniqid = function()
{
    this.getDb().query("update `adodbseq` set `id`=`id`+1");
    return parseInt( this.getDb().get_one("select `id` from `adodbseq`"), 10)
}


/**
 * Returns object data as an array of field values.
 * @return Array
 */
exports.toArray = function()
{
    var list = [];
    for each (let field in this.getFieldNames())
        list.push(this[field]);
    return list;
}

