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

require("core/date");

var db = loadObject("DB");
var new_db = loadObject("ctl/JsonStorage");
// original_id to new added_id:
exports.oid2addid = {};
// original_id to doc_id:
exports.oid2did = {};


exports.migrate = function() {

    print(new Date());
    this.docs();

    
    print(new Date());
    this.originals();

    /*
    print(new Date());
    this.create_listings();

    print(new Date());
    this.comments();
    */

    print(new Date());
}


// Create special chars RegExp:
var special_chars = ["["];
for (var i=0;i<32;i++)
    special_chars.push(String.fromCharCode(i));
special_chars.push("]");
special_chars = new RegExp(special_chars.join(""), "g");

/**
 *
 */
var fixString = function(str) {
    return str.replace(special_chars, " ").replace(/\s+/g, " ").trim();
}


/**
 *
 */
exports.docs = function(ids) {

    //var sql = "select id,original_id,comment_count,meta,html, convert_tz(updated,'SYSTEM','+00:00') as `update`, convert_tz(published,'SYSTEM','+00:00') as `publish` from docs order by published asc";
    if (ids === undefined)
        var sql = "select * from docs order by published asc";
    else
        var sql = "select * from docs where id in('" + ids.join("','") + "')";

    var rs = db.query(sql);
    if (!rs.first())
        return false;

    rs.beforeFirst();
    while (rs.next())
    {
        var doc = db.get_row(rs);
        try {
            var data = JSON.parse(doc.meta);
        } catch (e) {
            print(doc.meta);
            print(e);
        }

        data.id             = doc.id;
        data.original_id    = doc.original_id;
        data.updated        = doc.updated;
        data.published      = doc.published;
        data.comment_count  = doc.comment_count;
        data.html           = doc.html;

        data.title = fixString(data.title);
        data.html  = fixString(data.html);

        var id = "/docs/" + data.published.substr(0, 10).replace(/-/g, "/") + "/" + data.original_id + "/doc";
        new_db.write(id, data);
    }

    rs.getStatement().close();
}


/**
 *
 */
exports.originals = function() {
    //var sql = "select id,source,url,meta,html, convert_tz(updated,'SYSTEM','+00:00') as `update`, convert_tz(published,'SYSTEM','+00:00') as `publish` from originals";
    var sql = "select * from originals";

    var rs = db.query(sql);
    if (!rs.first())
        return false;

    rs.beforeFirst();
    while (rs.next())
    {
        var original = db.get_row(rs);
        try {
            var data = JSON.parse(original.meta);
        } catch (e) {
            print(original.meta);
            print(e);
        }

        data.id         = original.id;
        data.updated    = original.updated;
        data.published  = original.published;
        data.source     = original.source;
        data.url        = original.url
        data.html       = original.html;

        var id = "/originals/" + data.published.substr(0, 10).replace(/-/g, "/") + "/" + data.id + "/doc";
        new_db.write(id, data);
    }

    rs.getStatement().close();
}


/**
 *
 */
exports.create_listings = function() {
    
    var sql = "select docs.id as doc_id, docs.convertion as convertion, convertions.created as updated, convertions.body as body, docs.comment_count as comment_count from docs, convertions where convertions.id = docs.convertion";

    var rs = db_new.query(sql);
    if (!rs.first())
        return false;

    rs.beforeFirst();
    while (rs.next())
    {
        var doc = db_new.get_row(rs);
        doc.body= JSON.parse(doc.body);

        var sql = "insert into doc_listing (doc_id, convertion, published, updated, title, source, comment_count) values(?,?,?,?,?,?,?)";

        if (doc.body.title.length > 255)
            doc.body.title = doc.body.title.substr(0, 252) + "...";

        db_new.prepared_query(sql, [doc.doc_id, doc.convertion, doc.body.published, doc.updated, doc.body.title, doc.body.short_source, doc.comment_count] );
    }

    rs.getStatement().close();
}


/**
 *
 */
exports.comments = function() {

    var sql=" insert into policyfeed.comments (updated, parent_id, thread_id, author, user_id, score, text) (select updated, parent_id, thread_id, author, user_id, score, text from govsrvr.comments)";

    return db_new.query(sql);
}
