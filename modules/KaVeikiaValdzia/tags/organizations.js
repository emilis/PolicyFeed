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
var update_url = 'https://spreadsheets.google.com/pub?key=0AsZzrrKkSKzMdC1oYnQtWGtGaFRXWnBwZFdVWjlJeXc&authkey=CIOU65QB&hl=en&single=true&gid=0&output=csv';


// Extend and connect to db table:
gluestick.extendModule(exports, "ctl/objectfs/dbtable");
exports.connect("DB_tags", "organizations");

// Driver for org2q table:
exports.org2q = gluestick.extendModule({}, "ctl/objectfs/dbtable");
exports.org2q.connect("DB_tags", "org2q");


/**
 *
 */
exports.handleDocMatches = function(id, doc, matches) {
    if (!matches || !matches.length)
        return true;

    var oids = this.org2q.list({ qid: matches }).map(function(row) { return row.oid; });
    var orgs = this.list({ id: oids });

    doc.tags = doc.tags || {};
    doc.tags.organizations = orgs;

    return jsonfs.write(id, doc);
}


/**
 *
 */
exports.allowRemoveQueries = function(qids) {
    var myqids = this.org2q.list({ qid: qids });

    return qids.filter(function (qid) {
            return (myqids.indexOf(qid) == -1);
            });
}

//----------------------------------------------------------------------------

/**
 *
 */
exports.serializeFields = function(data) {

    data.active = data.active || false;
    data.region = data.region || false;
    data.queries = data.queries || false;
    data.url = data.url || false;
    data.name_forms = data.name_forms || false;

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
        data.query = 'org:"' + data.org + '","' + data.organization + '"';
        if (data.name_forms) {
            data.query += ',"' + data.name_forms + '"';
        }
        if (data.queries) {
            data.query += ',' + data.queries;
        }
    }
    return data;
}


/**
 *
 */
exports._update_qids = function(oid, queries) {
    // remove old queries:
    var rem_list = this.org2q.list({ oid: oid });
    this.org2q.remove({oid: oid});
    var qids = rem_list.map(function(item) { return item.qid; });
    DocQueries.removeQueries(qids);

    // add new queries:
    qids = DocQueries.addQueries(queries);
    for each (var qid in qids) {
        this.org2q.write(false, {oid: oid, qid:qid});
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
 * Returns a dictionary of organizations indexed by organization.org field.
 */
exports.getOrgMap = function() {
    var list = this.list();
    var map = {};
    var org;
    while (org = list.pop()) {
        map[org.org] = org;
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

    var orgmap = this.getOrgMap();

    var created = [];
    var updated = [];
    for each (var neworg in list) {
        if (!orgmap[neworg.org]) {
            neworg.id = this.create(false, neworg);
            created.push(neworg);
        } else {
            var oldorg = orgmap[neworg.org];

            var is_updated = ["organization","active","region","queries","url","name_forms"].some(function(field) {
                    return ((oldorg[field] || neworg[field]) && (oldorg[field] != neworg[field]));
                });

            if (is_updated) {
                this.update(oldorg.id, neworg);
                neworg.id = oldorg.id;
                updated.push(neworg);
            }
            delete orgmap[neworg.org];
        }
    } // end for each()

    print("=== Update status ==========");
    print("--- Created: ---------------");
    for each (var org in created) {
        print(org.id, org.org, org.organization);
    }
    print("--- Updated: ---------------");
    for each (var org in updated) {
        print(org.id, org.org, org.organization);
    }
    print("--- Not found in update: ---");
    for each (var org in orgmap) {
        print(org.id, org.org, org.organization);
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
                    if (!row[0] || row[0].indexOf("[") != -1 || row[2] != "y" || row[3] != "LT") {
                        return false;
                    } else {
                        return true; 
                    }
                })
                .map(function (row) { return {
                    org: row[0],
                    organization: row[1],
                    active: row[2],
                    region: row[3],
                    queries: row[4],
                    url: row[5],
                    name_forms: row[6]
                    };
                });
}


/**
 *
 */
exports.checkImportList = function(list) {

    if (typeof(list) == "string" || list instanceof String)
        list = this.parseImportFile(list);

    var org = {};
    var organization = {};
    var queries = {};

    for each (var item in list) {
        if (org[item.org]) {
            throw Error("Duplicate org for '" + org[item.org] + "' and '" + item.organization + "'");
        } else {
            org[item.org] = item.organization;
        }

        if (organization[item.organization]) {
            throw Error("Duplicate organization '" + item.organization + "' found.");
        } else {
            organization[item.organization] = true;
        }

        if (item.queries) {
            if (queries[item.queries]) {
                throw Error("Duplicate queries for '" + queries[item.queries] + "' and '" + item.organization + "'");
            } else {
                queries[item.queries] = item.organization;
            }
        }
    }

    return true;
}


