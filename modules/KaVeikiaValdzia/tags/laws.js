/*
    Copyright 2010 Emilis Dambauskas

    This file is part of KąVeikiaValdžia.lt website.

    KąVeikiaValdžia.lt is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    KąVeikiaValdžia.lt is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with KąVeikiaValdžia.lt.  If not, see <http://www.gnu.org/licenses/>.
*/


// Requirements:
var config = require("config");
var DocQueries = require("PolicyFeed/Crawler/DocQueries");
var gluestick = require("gluestick");
var jsonfs = require("ctl/objectfs/json");

// Constants:
var update_url = 'http://teisynas.lt/files/laws.json';


// Extend and connect to db table:
gluestick.extendModule(exports, "ctl/objectfs/dbtable");
exports.connect("DB_tags", "laws");

// Driver for p2q table:
exports.l2q = gluestick.extendModule({}, "ctl/objectfs/dbtable");
exports.l2q.connect("DB_tags", "l2q");


/**
 *
 */
exports.handleDocMatches = function(id, doc, matches) {
    if (!matches || !matches.length)
        return true;

    var lids = this.l2q.list({ qid: matches }).map(function(row) { return row.lid; });
    var laws = this.list({ id: lids });

    if (laws.length) {
        doc.tags.laws = laws;
        doc.tags = doc.tags || {};
        return jsonfs.write(id, doc);
    }
}


/**
 *
 */
exports.allowRemoveQueries = function(qids) {
    var myqids = this.l2q.list({ qid: qids });

    return qids.filter(function (qid) {
            return (myqids.indexOf(qid) == -1);
            });
}

//----------------------------------------------------------------------------

/**
 *
 */
exports.serializeFields = function(data) {

    data.nr = data.nr || false;
    data.url = data.url || false;
    data.title = data.title || false;

    return this.createQueryField(data);
}


/**
 *
 */
exports.unserializeFields = function(data) {
    return data;
}


/**
 *
 */
exports.createQueryField = function(data) {

    if (!data.query) {
        data.query = '"' + data.title.replace(/"/g, "") + '"';
        if (data.nr && !data.nr.match(/^\d+$/)) {
            data.query += ',"' + data.nr.replace(/"/g, "") + '"';
        }
    }
    return data;
}


/**
 *
 */
exports._update_qids = function(lid, queries) {
    // remove old queries:
    var rem_list = this.l2q.list({ lid: lid });
    this.l2q.remove({lid: lid});
    var qids = rem_list.map(function(item) { return item.qid; });
    DocQueries.removeQueries(qids);

    // add new queries:
    qids = DocQueries.addQueries(queries);
    for each (var qid in qids) {
        this.l2q.write(false, {lid: lid, qid:qid});
    }
}


/**
 *
 */
exports.parent_create = exports.create;
exports.create = function(id, data) {

    data = this.serializeFields(data);
    if (id = this.parent_create(id, data)) {
        this._update_qids(id, [data.query]);
        return id;
    }
}

/**
 *
 */
exports.parent_update = exports.update;
exports.update = function(id, data) {

    data = this.serializeFields(data);
    if (this.parent_update(id, data)) {
        this._update_qids(id, [data.query]);
        return true;
    }
}


//----------------------------------------------------------------------------

/**
 *
 */
exports.getUrlMap = function() {
    var map = {};
    for each (var law in this.list()) {
        map[law.url] = law;
    }
    return map;
}

/**
 *
 */
exports.import = function(url) {
    url = url || update_url;

    var list = this.parseImportFile(url);

    if (!this.checkImportList(list))
        return false;

    var newmap = {};
    for each (var newlaw in list) {
        newmap[newlaw.url] = newlaw;
    }

    var oldmap = this.getUrlMap() || {};

    var created = [];
    var updated = [];
    for (var url in newmap) {
        var newlaw = newmap[url];

        if (!oldmap[url]) {
            newlaw.id = this.create(false, newlaw);
            created.push(newlaw);
        } else {
            var oldlaw = oldmap[url];

            var is_updated = ["title","nr"].some(function(field) {
                    return ((oldlaw[field] || newlaw[field]) && (oldlaw[field] != newlaw[field]));
                    });

            if (is_updated) {
                this.update(oldlaw.id, newlaw);
                newlaw.id = oldlaw.id;
                updated.push(newlaw);
            }
            delete oldmap[url];
        }
    } // end for each()

    print("=== Update status ==========");
    print("--- Created: ---------------");
    for each (var law in created) {
        print(law.id, law.url, law.title);
    }
    print("--- Updated: ---------------");
    for each (var law in updated) {
        print(law.id, law.url, law.title);
    }
    print("--- Not found in update: ---");
    for each (var law in oldmap) {
        print(law.id, law.url, law.title);
    }
    print("=== End of update ==========");

    return true;
}


/**
 *
 */
exports.parseImportFile = function(file_name) {
    if (file_name.indexOf("://") != -1) {
        var content = require("htmlunit").getPage(file_name).webResponse.contentAsString;
    } else {
        var content = fs.read(file_name);
    }

    var data = JSON.parse(content);
    var fields = data.fields;
    var list = [];
    for each (var row in data.data) {
        var item = {};
        for (var i in fields) {
            item[fields[i]] = row[i];
        }
        list.push(item);
    }
    return list;
}


/**
 *
 */
exports.checkImportList = function(list) {

    if (typeof(list) == "string" || list instanceof String)
        list = this.parseImportFile(list);

    var nrs = {};
    var titles = {};
    var keys = {};

    for each (var item in list) {

        var key = item.title + "|" + item.nr.trim();
        if (keys[key]) {
            if (item.url > keys[key].url) {
                keys[key] = item;
            }
        } else {
            keys[key] = item;
        }

        /*
        if (titles[item.title]) {
            throw Error("Duplicate titles for '" + titles[item.title].url + "' and '" + item.url + "': '" + item.title + "'.");
        } else {
            titles[item.title] = item;
        }
        */
        /*
        item.nr = item.nr.trim();
        if (item.nr && nrs[item.nr]) {
            throw Error("Duplicate nrs for '" + nrs[item.nr].url + "' and '" + item.url + "': '" + item.nr + "'.");
        } else {
            nrs[item.nr] = item;
        }
        */
    }

    return true;
}


