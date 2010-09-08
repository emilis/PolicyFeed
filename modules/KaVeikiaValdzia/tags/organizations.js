

// Requirements:
var config = require("config");
var csv = require("ctl/utils/csv");
var DocQueries = require("PolicyFeed/Crawler/DocQueries");
var gluestick = require("gluestick");
var jsonfs = require("ctl/objectfs/json");


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


/**
 *
 */
exports.createQueryField = function(data) {
    if (!data.query) {
        data.query = 'org:"' + data.org + '","' + data.organization + '",';
        if (data.name_forms) {
            data.query += '"' + data.name_forms + '",';
        }
        data.query += data.queries;
    }
    return data;
}


/**
 *
 */
exports._update_qids = function(oid, queries) {
    var qids = DocQueries.addQueries(queries);

    this.org2q.remove({oid: oid});
    for each (var qid in qids) {
        this.org2q.write(false, {oid: oid, qid:qid});
    }
}


/**
 *
 */
exports.parent_create = exports.create;
exports.create = function(id, data) {
    data = this.createQueryField(data);
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

    data = this.createQueryField(data);
    if (this.parent_update(id, data)) {
        this._update_qids(id, [data,query]);
        return true;
    }
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


//----------------------------------------------------------------------------


exports.splitCSV = function(str, sep) {

    str = str || "";
    sep = sep || ",";
    var foo = str.split(sep);
    
    for (var x = foo.length - 1; x >= 0; x--) {
        var tl;
        if (foo[x].replace(/"\s+$/, '"').charAt(foo[x].length - 1) == '"') {
            tl = foo[x].replace(/^\s+"/, '"');
            if (tl.length > 1 && tl[0] == '"') {
                foo[x] = foo[x].replace(/^\s*"|"\s*$/g, '').replace(/""/g, '"');
            } else if (x) {
                foo.splice(x - 1, 2, [foo[x - 1], foo[x]].join(sep));
            } else {
                foo = foo.shift().split(sep).concat(foo);
            }
        } else {
            foo[x].replace(/""/g, '"');
        }
    }
    return foo;
};



