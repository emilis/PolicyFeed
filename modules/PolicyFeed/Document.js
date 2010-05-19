/*
    Copyright 2009,2010 Emilis Dambauskas

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

exports.extendObject("ctl/DataObject/DbRow");

exports._tableName = "docs";


// Create public attributes:
for each (var field in exports.getFieldNames())
{
    exports[field] = false;
}
exports.meta = {};

exports.tableName = function()
{
    return this._tableName 
}


exports.assignFields = function(data)
{
    // Add default field values for all fields if they are missing in data:
    data = data.clone({
        id: false,
        original_id: false,
        updated: false,
        published: false,
        comment_count: 0,
        meta: {},
        html: false});

    return this.updateFields(data);
}

exports.updateFields = function(data)
{
    if (typeof(data.meta) == "string" || data.meta instanceof String || data.meta instanceof java.lang.String)
        data.meta = JSON.parse(data.meta);

    for (field in data)
    {
        if (this._fieldNames.indexOf(field) > -1)
            this[field] = data[field];
        else
            this.meta[field] = data[field];
    }

    return data;
}

exports.insert = function()
{
    if (!this.id)
        this.id = this.uniqid();

    var sql = "insert into " + this._tableName + " (id, original_id, published, comment_count, meta, html) values(?,?,?,?,?,?)";

    return this.getDb().prepared_query(sql, [
        this.id,
        this.original_id,
        this.published,
        this.comment_count,
        JSON.stringify(this.meta),
        this.html]);
}

exports.update = function()
{
    var sql = "update " + this._tableName + " set original_id=?, published=?, comment_count=?, meta=?, html=? WHERE id=?";

    return this.getDb().prepared_query(sql, [
        this.original_id,
        this.published,
        this.comment_count,
        JSON.stringify(this.meta),
        this.html,
        this.id]);
}


exports.commentAdded = function(id)
{
    var sql = "update " + this._tableName + " set comment_count = comment_count + 1 where id=?";
    return this.getDb().prepared_query(sql, [id]);
}
