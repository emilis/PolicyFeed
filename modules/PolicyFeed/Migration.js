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

var DB_old = loadObject("DB_old");
var JsonStorage = require("ctl/JsonStorage");
var Sequence = require("ctl/SimpleSequence");

// original_id to new added_id:
exports.oid2new = {};

// old-source -> type map:
var typemap = {
    LRS_darbotvarkes: "darbotvarke",
    LRS_pranesimai_spaudai: "pranesimas",
    LRS_teises_aktai: "projektas",
    LRV_darbotvarkes: "darbotvarke",
    LRV_naujienos: "pranesimas"
};

var orgs = {
    LRS: ["Seimas", "Lietuvos Respublikos Seimas"],
    LRV: ["Vyriausybė", "Lietuvos Respublikos Vyriausybė"]
};


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

//----------------------------------------------------------------------------

/**
 * Migrate everything.
 */
exports.migrate = function() {

    print(new Date());

    this.originals();

    print(new Date());

    this.docs();

    print(new Date());
}


/**
 *
 */
exports.docs = function(ids) {
    if (ids === undefined)
        var sql = "select * from docs order by published asc";
    else
        var sql = "select * from docs where id in('" + ids.join("','") + "')";

    var rs = DB_old.query(sql);
    if (!rs.first())
        return false;

    rs.beforeFirst();
    while (rs.next())
    {
        var doc = DB_old.get_row(rs);
        try {
            var data = JSON.parse(doc.meta);
        } catch (e) {
            print(doc.meta);
            print(e);
        }

        //data.id             = doc.id;
        //data.original_id    = doc.original_id;
        data.updated        = doc.updated;
        data.published      = doc.published;
        data.comment_count  = doc.comment_count;
        data.html           = doc.html;

        data.title = fixString(data.title);
        data.html  = fixString(data.html);

        data.type = typemap[data.source];
        data.org = orgs[data.source.substr(0, 3)][0];
        data.organization = orgs[data.source.substr(0, 3)][1];

        var id = oid2new[data.original_id].replace("originals", "docs");
        JsonStorage.write(id, data);
    }

    rs.getStatement().close();
}


/**
 *
 */
exports.originals = function() {
    var sql = "select * from originals";

    var rs = DB_old.query(sql);
    if (!rs.first())
        return false;

    rs.beforeFirst();
    while (rs.next())
    {
        var original = DB_old.get_row(rs);
        try {
            var data = JSON.parse(original.meta);
        } catch (e) {
            print(original.meta);
            print(e);
        }

        data.updated    = original.updated;
        data.published  = original.published;
        data.parser     = original.source;
        data.url        = original.url
        data.html       = original.html;

        data.type = typemap[original.source];
        data.org = orgs[original.source.substr(0, 3)][0];
        data.organization = orgs[original.source.substr(0, 3)][1];

        var id = "/originals/" + data.published.substr(0, 10).replace(/-/g, "/") + "/" + original.id;

        JsonStorage.write(id, data);

        oid2new[original.id] = id;
    }

    rs.getStatement().close();
}


/**
 *
 */
exports.comments = function() {

    var sql="select updated, parent_id, thread_id, author, user_id, score, text from govsrvr.comments";

    var rs = db.query(sql);
}
