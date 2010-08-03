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
var UrlList = require("PolicyFeed/UrlList");

// original_id to new added_id:
exports.oid2new = {};

// old-source -> type map:
exports.sourcemap = {
    LRS_darbotvarkes: ["lrs.lt-darbotvarkes", "darbotvarke", "Seimas", "Lietuvos Respublikos Seimas"],
    LRS_pranesimai_spaudai: ["lrs.lt-pranesimai", "pranesimas", "Seimas", "Lietuvos Respublikos Seimas"],
    LRS_teises_aktai: ["lrs.lt-teises-aktai", "projektas", "Seimas", "Lietuvos Respublikos Seimas"],
    LRV_darbotvarkes: ["lrv.lt-darbotvarkes", "darbotvarke", "Vyriausybė", "Lietuvos Respublikos Vyriausybė"],
    LRV_naujienos: ["lrv.lt-naujienos", "pranesimas", "Vyriausybė", "Lietuvos Respublikos Vyriausybė"]
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


/**
 *
 */
var getDateFromString = function(str) {
    str = str.replace(/-T:.Z/g, "-").split("-").map(function (item) { return parseInt(item, 10); });
    str[1]--; // fix month

    for (var i=0;i<7;i++) {
        if (!str[i])
            str[i] = 0;
    }

    return new Date(str[0], str[1], str[2], str[3], str[4], str[5], str[6]);
}

//----------------------------------------------------------------------------

/**
 *
 */
exports.sourceToNewFields = function(doc, source) {
    if (!source) {
        throw Error('Migration.sourceToNewFields: document ' + doc.id + '/' + doc._id + ' has no source field.');
    } else if (!this.sourcemap[source]) {
        throw Error('Migration.sourceToNewFields: unsupported source "' + source + '" for document ' + doc.id + '/' + doc._id + '.');
    } else {
        [doc.parser, doc.type, doc.org, doc.organization] = this.sourcemap[source];
        return doc;
    }
}


/**
 *
 */
exports.getDataFromDoc = function(doc) {
    try {
        var data = JSON.parse(doc.meta);
    } catch (e) {
        print(doc.meta);
        print(e);
    }

    data.updated        = getDateFromString(doc.updated);
    data.published      = getDateFromString(doc.published);
    data.comment_count  = parseInt(doc.comment_count, 10);
    data.html           = fixString(doc.html);

    data = this.sourceToNewFields(data, doc.source);
    return data;
}


/**
 *
 */
exports.getDataFromOriginal = function(doc) {
    try {
        var data = JSON.parse(doc.meta);
    } catch (e) {
        print(doc.meta);
        print(e);
    }

    data.updated        = getDateFromString(doc.updated);
    data.published      = getDateFromString(doc.published);
    data.url            = doc.url;
    data.html           = fixString(doc.html);

    data = this.sourceToNewFields(data, doc.source);
    return data;
}

/**
 *
 */
exports.migrateDocs = function(ids) {
    if (ids === undefined)
        var sql = "select * from docs order by id asc";
    else
        var sql = "select * from docs where id in('" + ids.join("','") + "')";

    var rs = DB_old.query(sql);
    if (!rs.first())
        return false;

    rs.beforeFirst();
    while (rs.next())
    {
        var old_doc = DB_old.get_row(rs);
        var url = old_doc.meta.url;

        if (UrlList.exists(url)) {
            var original = JsonStorage.read(UrlList.getDocId(url));

            old_doc.published = getDateFromString(old_doc.published);
            original.published = getDateFromString(original.published);

            // if original.published is later, fix it according to old_doc.published:
            if (old_doc.published < original.published) {
                // same date:
                if (original.published.format("yyyy-MM-dd") == old_doc.published.format("yyyy-MM-dd")) {
                    // update original.published:
                    original.published = old_doc.published;
                    JsonStorage.write(original._id, original);

                    // update doc.published:
                    var doc = JsonStorage.read(original._id.replace("originals", "docs"));
                    doc.published = original.published;
                    JsonStorage.write(doc._id, doc);

                } else {
                    // move original+doc to another location
                    original.published = old_doc.published;
                    var new_id = "/originals/" + original.published.format("yyyy/MM/dd/") + old_doc.id;

                    JsonStorage.move(original._id, new_id);
                    JsonStorage.move(
                            original._id.replace("originals", "docs"),
                            new_id.replace("originals", "docs"));

                    UrlList.removeUrl(url);
                    UrlList.addUrl(url, new_id);
                }
            }
        } else {
            // create new document and original
            var data = this.getDataFromDoc(old_doc);
            var id = "/docs/" + data.published.format("yyyy/MM/dd/") + old_doc.id;
        
            JsonStorage.write(id, data);

            var sql = "select * from originals where id=?";
            var old_orig = DB_old.get_row(DB_old.prepared_query(sql, [old_doc.original_id]));
            var original = this.getDataFromOriginal(old_orig);
            id = id.replace("docs", "originals");

            JsonStorage.write(id, original);
            UrlList.addUrl(url, id);
        }
    }

    rs.getStatement().close();
}


