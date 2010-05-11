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


// Extends:
exports.extendObject("ctl/DataObject/DbRow");


// Attributes:
exports._tableName = "originals";

var data_dir = require("config").DATA_DIR + "/PolicyFeed/Originals";

// --- Constructor: ---

// Create public attributes:
for each (var field in exports.getFieldNames())
{
    exports[field] = false;
}
exports.meta = {};

// --- Public methods: ---

exports.validate = function()
{
    if (!this.published)
        return false;
    if (!this.source)
        return false;
    if (!this.url)
        return false;

    return true;
}


exports.assignFields = function(data)
{
    // Add default field values for all fields if they are missing in data:
    data = data.clone({
        id: false,
        updated: false,
        published: false,
        source: false,
        url: false,
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

    var sql = "insert into " + this._tableName + " (id, published, source, url, meta, html) values(?,?,?,?,?,?)";

    return this.getDb().prepared_query(sql, [
        this.id,
        this.published,
        this.source,
        this.url,
        JSON.stringify(this.meta),
        this.html]);
}

exports.update = function()
{
    var sql = "update " + this._tableName + " set published=?, source=?, url=?, meta=?, html=? WHERE id=?";

    return this.getDb().prepared_query(sql, [
        this.published,
        this.source,
        this.url,
        JSON.stringify(this.meta),
        this.html,
        this.id]);
}


/**
 * Checks if there are documents converted from the original. 
 */
exports.isConverted = function()
{
    if (!this.id)
        return false;

    var doc = newObject("PolicyFeed/Document");
    var sql = "select original_id from " + doc.tableName() + " where original_id=?";

    var rs = this.getDb().prepared_query(sql, [this.id]);
    var result = rs && rs.first();
    rs.getStatement().close();
    return result;
}


/**
 *
 */
exports.searchBySourceAndUrl = function(source, url)
{
    var sql = "select id from " + this._tableName + " where source=? and url=?";
    var rs = this.getDb().prepared_query(sql, [source, url]);
    
    var result = rs.first();
    rs.getStatement().close();
    return result;
}


/**
 *
 */
exports.setFieldsFromStream = function(stream, content_type)
{
    this.meta.content_type = content_type;
    if (!this.id)
        this.id = this.uniqid();

    // requirements to save file:
    import("file");
    import("core/date");

    // save file:
    var dir_name = data_dir + (new Date().format("/yyyy/MM/dd"));
    if (!file.exists(dir_name))
        file.mkdirs(dir_name);
    var file_name = dir_name + "/" + this.id + ".orig";
    file.write(file_name, stream.read());

    this.meta.original_file = file_name;

    // Convert file to HTML and read the result if possible:
    switch (content_type)
    {
        case "application/msword":
            // Convert DOC to HTML:
            var proc = java.lang.Runtime.getRuntime().exec(["abiword", "--to", "html", file_name]);
            proc.waitFor();

            // Set html field:
            var html_file_name = dir_name + "/" + this.id + ".html";
            this.html = file.read(html_file_name);
            this.meta.converted_by = "abiword";

            // Remove converted HTML to save disk space:
            //file.remove(html_file_name);
            loadObject("Events").create("PolicyFeed/OriginalDocument:setFieldsFromStream-debug", ["html_file_name", html_file_name]);

            return true;
            break;

        default:
            this.html = "";
            return false;
    }
}

