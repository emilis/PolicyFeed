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
var csv = require("ctl/utils/csv");
var DocQueries = require("PolicyFeed/Crawler/DocQueries");
var gluestick = require("gluestick");
var jsonfs = require("ctl/objectfs/json");

// Constants:
var update_url = 'https://spreadsheets.google.com/pub?key=0AsZzrrKkSKzMdC1oYnQtWGtGaFRXWnBwZFdVWjlJeXc&authkey=CIOU65QB&hl=en&single=true&gid=1&output=csv';


// Extend and connect to db table:
gluestick.extendModule(exports, "ctl/objectfs/dbtable");
exports.connect("DB_tags", "people");

// Driver for p2q table:
exports.p2q = gluestick.extendModule({}, "ctl/objectfs/dbtable");
exports.p2q.connect("DB_tags", "p2q");


/**
 *
 */
exports.handleDocMatches = function(id, doc, matches) {
    if (!matches || !matches.length)
        return true;

    var pids = this.p2q.list({ qid: matches }).map(function(row) { return row.pid; });
    var people = this.list({ id: pids });

    if (people.length) {
        doc.tags = doc.tags || {};
        doc.tags.people = people;
        return jsonfs.write(id, doc);
    }
}


/**
 *
 */
exports.allowRemoveQueries = function(qids) {
    var myqids = this.p2q.list({ qid: qids });

    return qids.filter(function (qid) {
            return (myqids.indexOf(qid) == -1);
            });
}

//----------------------------------------------------------------------------

/**
 *
 */
exports.serializeFields = function(data) {

    data.title = data.title || false;
    data.queries = data.queries || false;
    data.wikipedia = data.wikipedia || false;
    data.blog = data.blog || false;
    data.url = data.url || false;

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
        var fname = data.fname.trim().split(" ");
        var initials = fname.map(function(word) { return word[0]; });

        var q = [];
        q.push(data.fname + " " + data.lname);
        q.push(initials.join(" ") + " " + data.lname);
        if (fname.length > 1) {
            q.push(fname[0] + " " + data.lname);
            q.push(initials[0] + " " + data.lname);
        }

        data.query = '"' + q.join('","') + '"';
        if (data.queries) {
            data.query += "," + data.queries;
        }
    }
    return data;
}


/**
 *
 */
exports._update_qids = function(pid, queries) {
    // remove old queries:
    var rem_list = this.p2q.list({ pid: pid });
    this.p2q.remove({pid: pid});
    var qids = rem_list.map(function(item) { return item.qid; });
    DocQueries.removeQueries(qids);

    // add new queries:
    qids = DocQueries.addQueries(queries);
    for each (var qid in qids) {
        this.p2q.write(false, {pid: pid, qid:qid});
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


/**
 * Returns a dictionary of people indexed by full name.
 */
exports.getMap = function() {
    var list = this.list();
    var map = {};
    var person;
    while (person = list.pop()) {
        map[person.fname + " " + person.lname] = person;
    }
    return map;
}


//----------------------------------------------------------------------------

/**
 *
 */
exports.import = function(url) {
    url = url || update_url;

    var list = this.parseImportFile(url);

    if (!this.checkImportList(list))
        return false;

    var newmap = {};
    for each (var newp in list) {
        var index = newp.fname + " " + newp.lname;
        if (newmap[index]) {
            newmap[index].title += "/" + newp.title;
        } else {
            newmap[index] = newp;
        }
        //todo: what should we do with other fields like wikipedia,blog,url..?
    }

    var map = this.getMap();

    var created = [];
    var updated = [];
    for (var index in newmap) {
        var newp = newmap[index];
        if (!map[index]) {
            newp.id = this.create(false, newp);
            created.push(newp);
        } else {
            var oldp = map[index];

            var is_updated = ["title","queries","wikipedia","blog","url"].some(function(field) {
                    return ((oldp[field] || newp[field]) && (oldp[field] != newp[field]));
                });

            if (is_updated) {
                this.update(oldp.id, newp);
                newp.id = oldp.id;
                updated.push(newp);
            }
            delete map[index];
        }
    } // end for each()

    print("=== Update status ==========");
    print("--- Created: ---------------");
    for each (var person in created) {
        print(person.id, person.fname, person.lname, person.title);
    }
    print("--- Updated: ---------------");
    for each (var person in updated) {
        print(person.id, person.fname, person.lname, person.title);
    }
    print("--- Not found in update: ---");
    for each (var person in map) {
        print(person.id, person.fname, person.lname, person.title);
    }
    print("=== End of update ==========");

    return true;
}


/**
 *
 */
exports.parseImportFile = function(file_name) {
    if (file_name.indexOf("://") != -1) {
        var content = require("htmlunit").getPage(file_name).content;
    } else {
        var content = fs.read(file_name);
    }

    return csv.parse(content)
            .filter(function (row) { 
                    if (!row[0] || row[0].indexOf("[") != -1 || !row[1]) {
                        return false;
                    } else {
                        return true; 
                    }
                })
                .map(function (row) { return {
                    fname: row[0],
                    lname: row[1],
                    title: row[2],
                    queries: row[3],
                    wikipedia: row[4],
                    blog: row[5],
                    url: row[6]
                    };
                });
}


/**
 *
 */
exports.checkImportList = function(list) {

    if (typeof(list) == "string" || list instanceof String)
        list = this.parseImportFile(list);

    var queries = {};

    for each (var item in list) {
        var index = item.fname + " " + item.lname;

        if (item.queries) {
            if (queries[item.queries]) {
                throw Error("Duplicate queries for '" + queries[item.queries] + "' and '" + index + "'");
            } else {
                queries[item.queries] = index;
            }
        }
    }

    return true;
}


