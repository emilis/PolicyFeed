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
/*
    @fileoverview Data management for alerts.
*/

// Requirements:
var ctlTemplate = require("ctl/Template/Cached");
var DocQueries = require("PolicyFeed/Crawler/DocQueries");
var gluestick = require("gluestick");
var mail = require("ringo/mail");
var ringo_arrays = require("ringo/utils/arrays");

// Constants:
var tpl_dir = module.directory + "/Alerts/tpl/";
var alert_tpl = tpl_dir + "alert.ejs";

// Extend DB table:
gluestick.extendModule(exports, "ctl/objectfs/dbtable");
exports.connect("DB_alerts", "alerts");

// Alert 2 query table:
exports.a2q = gluestick.extendModule({}, "ctl/objectfs/dbtable");
exports.a2q.connect("DB_alerts", "a2q");

// Unconfirmed alert table:
exports.unconfirmed = gluestick.extendModule({}, "ctl/objectfs/dbtable");
exports.unconfirmed.connect("DB_alerts", "unconfirmed");


/**
 *
 */
exports.handleDocMatches = function(id, doc, matches) {

    if (!matches || !matches.length) {
        return true;
    }

    var ids = this.a2q.list({ qid: matches }).map(function(item) { return item.aid; });
    if (!ids || !ids.length) {
        return true;
    }

    // get a list of emails:
    var alerts = ringo_arrays.union(this.list({ id: ids}, {fields: ["email"]}));
        
    alerts.map(function(alert) {
            mail.send({
                to: alert.email,
                subject: doc.org + '» ' + doc.type + '» ' + doc.title,
                html: ctlTemplate.fetch(alert_tpl, {
                    id: id,
                    doc: doc,
                    email: alert.email
                    })
                });
            });
}


/**
 *
 */
exports.allowRemoveQueries = function(qids) {
    var myqids = this.a2q.list({ qid: qids });

    return qids.filter(function (qid) {
            return (myqids.indexOf(qid) == -1);
            });
}


//----------------------------------------------------------------------------

/**
 *
 */
exports._update_qids = function(aid, queries) {
    // remove old queries:
    var rem_list = this.a2q.list({ aid: aid });
    this.a2q.remove({aid: aid});
    var qids = rem_list.map(function(item) { return item.qid; });
    DocQueries.removeQueries(qids);

    // add new queries:
    qids = DocQueries.addQueries(queries);
    for each (var qid in qids) {
        this.a2q.write(false, {aid: aid, qid:qid});
    }
}


/**
 *
 */
exports.parent_create = exports.create;
exports.create = function(id, data) {

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

    if (this.parent_update(id, data)) {
        this._update_qids(id, [data.query]);
        return true;
    }
}


/**
 *
 */
exports.parent_remove = exports.remove;
exports.remove = function(id) {
    
    if (this.parent_remove(id)) {
        this._update_qids(id, []);
        return true;
    }
}

