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
var UrlList = require("PolicyFeed/UrlList");
var SolrClient = require("PolicyFeed/SolrClient");

//----------------------------------------------------------------------------

// old-source -> type map:
exports.sourcemap = {
    LRS_darbotvarkes: ["lrs.lt-darbotvarkes", "darbotvarke", "Seimas", "Lietuvos Respublikos Seimas"],
    LRS_pranesimai_spaudai: ["lrs.lt-pranesimai", "pranesimas", "Seimas", "Lietuvos Respublikos Seimas"],
    LRS_teises_aktai: ["lrs.lt-teises-aktai", "projektas", "Seimas", "Lietuvos Respublikos Seimas"],
    LRV_darbotvarkes: ["lrv.lt-darbotvarkes", "darbotvarke", "Vyriausybė", "Lietuvos Respublikos Vyriausybė"],
    LRV_naujienos: ["lrv.lt-naujienos", "pranesimas", "Vyriausybė", "Lietuvos Respublikos Vyriausybė"]
};

// old-short-source -> source:
exports.short_to_long_source = {
    "LRS-PS": "LRS_pranesimai_spaudai",
    "LRS-DB": "LRS_darbotvarkes",
    "LRS-TA": "LRS_teises_aktai",
    "LRV-NA": "LRV_naujienos",
    "LRV-NAU": "LRV_naujienos",
    "LRV-DB": "LRV_darbotvarkes"
};

// Create special chars RegExp:
var special_chars = [];
for (var i=0;i<32;i++)
    special_chars.push(String.fromCharCode(i));
special_chars = "[" + special_chars.join("") + "]";

var jreg_replace = function(pattern, replacement, str) {
    return java.util.regex.Pattern.compile(pattern).matcher(str).replaceAll(replacement);
}

//----------------------------------------------------------------------------

exports.fixString = function(str) {
    str = jreg_replace(special_chars, " ", str);
    return jreg_replace("\\s+", " ", str).trim();
}

/**
 *
 */
exports.getDateFromString = function(str) {
    str = str.replace(/[- T:.Z]/g, "-").split("-").map(function (item) { return parseInt(item, 10); });
    str[1]--; // fix month

    for (var i=0;i<7;i++) {
        if (!str[i])
            str[i] = 0;
    }

    return new Date(str[0], str[1], str[2], str[3], str[4], str[5], str[6]);
}


/**
 *
 */
exports.sourceToNewFields = function(doc, source, short_source) {
    if (!source && short_source && this.short_to_long_source[short_source])
        source = this.short_to_long_source[short_source];

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
    if (typeof(doc.meta) == "string" || doc.meta instanceof String) {
        try {
            var data = JSON.parse(doc.meta);
        } catch (e) {
            print(doc.meta);
            print(e);
        }
    } else {
        var data = doc.meta;
    }

    data.updated        = this.getDateFromString(doc.updated);
    data.published      = this.getDateFromString(doc.published);
    data.comment_count  = parseInt(doc.comment_count, 10);
    data.html           = this.fixString(doc.html);

    data = this.sourceToNewFields(data, data.source, data.short_source);
    return data;
}


/**
 *
 */
exports.getDataFromOriginal = function(doc) {
    if (typeof(doc.meta) == "string" || doc.meta instanceof String) {
        try {
            var data = JSON.parse(doc.meta);
        } catch (e) {
            print(doc.meta);
            print(e);
        }
    } else {
        var data = doc.meta;
    }

    data.updated        = this.getDateFromString(doc.updated);
    data.published      = this.getDateFromString(doc.published);
    data.url            = doc.url;
    data.html           = this.fixString(doc.html);

    data = this.sourceToNewFields(data, data.source, data.short_source);
    return data;
}

//----------------------------------------------------------------------------

/**
 *
 */
exports.migrate = function() {
    print("========= Migrating all =========");
    print("--------- Fixing UrlList ---------");
    this.fixUrlList();
    print("--------- Importing docs ---------");
    this.migrateDocs();
    print("--------- Reindexing docs ---------");
    SolrClient.reindex();
    print("========= End of migration =========");
}

/**
 *
 */
exports.fixUrlList = function() {
    var gen = JsonStorage.iterate("/originals");
    for each (var original in gen) {
        if (!UrlList.exists(original.url)) {
            UrlList.addUrl(original.url, original._id);
        } else {
            var id = UrlList.getDocId(original.url);
            if (id != original._id) {
                if (id.replace("docs", "originals") == original._id || !JsonStorage.exists(id)) {
                    UrlList.removeUrl(original.url);
                    UrlList.addUrl(original.url, original._id);
                    print("Fixing url: ", original._id, id, original.url);
                } else if (!JsonStorage.exists(id.replace("originals", "docs"))) {
                    JsonStorage.remove(id);
                    UrlList.removeUrl(original.url);
                    UrlList.addUrl(original.url, original._id);
                    print("Fixing url, removing conflicting original: ", original._id, id, original.url);
                } else {
                    var other = JsonStorage.read(id);
                    if (other.published > original.published || (other.published == original.published && id > original._id)) {
                        JsonStorage.remove(id);
                        UrlList.removeUrl(original.url);
                        UrlList.addUrl(original.url, original._id);
                    } else {
                        JsonStorage.remove(original._id);
                    }
                    print("Removing newer original: ", original._id, id, original.url);
                }
            }
        }
    }
}

/**
 *
 */
exports.migrateDocs = function(ids) {
    if (ids === undefined)
        var sql = "select * from docs order by id asc";
    else
        var sql = "select * from docs where id in('" + ids.join("','") + "')";

    var stmt = DB_old.getConnection().createStatement(java.sql.ResultSet.TYPE_FORWARD_ONLY, java.sql.ResultSet.CONCUR_READ_ONLY);
    if (stmt.execute(sql))
        var rs = stmt.getResultSet();
    else
        return false;

    while (rs.next())
    {
        var messages = [];
        var old_doc = DB_old.get_row(rs);
        old_doc.meta = JSON.parse(old_doc.meta);
        var url = old_doc.meta.url;

        if (UrlList.exists(url)) {
            var original = JsonStorage.read(UrlList.getDocId(url));
            messages.push("Existing: " + original._id);

            old_doc.published = getDateFromString(old_doc.published);
            original.published = getDateFromString(original.published);

            // if original.published is later, fix it according to old_doc.published:
            if (old_doc.published < original.published) {
                // same date:
                if (original.published.format("yyyy-MM-dd") == old_doc.published.format("yyyy-MM-dd")) {
                    // update original.published:
                    original.published = old_doc.published;
                    JsonStorage.write(original._id, original);
                    messages.push("Updated original");

                    // update doc.published:
                    var doc = JsonStorage.read(original._id.replace("originals", "docs"));
                    doc.published = original.published;
                    JsonStorage.write(doc._id, doc);
                    messages.push("Updated doc");

                } else {
                    // move original+doc to another location
                    original.published = old_doc.published;
                    var new_id = "/originals/" + original.published.format("yyyy/MM/dd/") + old_doc.id;

                    JsonStorage.move(original._id, new_id);
                    JsonStorage.move(
                            original._id.replace("originals", "docs"),
                            new_id.replace("originals", "docs"));

                    messages.push("Moved original from " + original._id + " to " + new_id);

                    UrlList.removeUrl(url);
                    UrlList.addUrl(url, new_id);
                }
            } else {
                messages.push("Document exists and should be up to date");
            }
        } else {
            // create new document and original
            var data = exports.getDataFromDoc(old_doc);

            var id = "/docs/" + data.published.format("yyyy/MM/dd/") + old_doc.id;
        
            JsonStorage.write(id, data);
            messages.push("New doc written: " + id);

            var sql = "select * from originals where id=?";
            var ors = DB_old.prepared_query(sql, [old_doc.original_id]);
            if (ors.first()) {
                var old_orig = DB_old.get_row(ors);
                var original = this.getDataFromOriginal(old_orig);
            } else {
                var original = data;
            }
            ors.getStatement().close();

            // create original
            id = id.replace("docs", "originals");
            JsonStorage.write(id, original);
            UrlList.addUrl(url, id);
            messages.push("New original written: " + id);
        }

        print(old_doc.id, messages.join(". "));
    }

    rs.getStatement().close();
}


