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

// Requirements:
var config = require("config");
var gluestick = require("gluestick");
var SolrUtils = require("PolicyFeed/Solr/Utils");


// Extend and connect to db table:
gluestick.extendModule(exports, "ctl/objectfs/dbtable");
exports.connect("DB_queries", "queries");

// Get config for module:
module.config = config[module.id] || {
    handlers: []
};


// Load all handlers:
for (var i in module.config.handlers) {
    var handler = module.config.handlers[i];
    if (typeof(handler) == "string" || (handler instanceof String)) {
        module.config.handlers[i] = gluestick.loadModule(handler);
    }
}

/**
 *
 */
exports.addQueries = function(qlist) {

    // get ids for existing queries:
    var qids = this.list({ query: qlist }).map(function(row) {
            delete qlist[qlist.indexOf(row.query)];
            return row.id;
            });

    // get ids for the new queries:
    for each (var q in qlist) {
        qids.push(this.create(false, { query: q }));
    }

    return qids;
}


/**
 *
 */
exports.removeQueries = function(qids) {

    // Check if queries can be removed with all handlers:
    for each (var handler in module.config.handlers) {
        qids = handler.allowRemoveQueries(qids);
    }

    this.remove({ id: qids });
}


/**
 *
 */
exports.runQueries = function(evt, id, doc) {

    // Get queries:
    var list = this.list();

    // Create query => id dictionary:
    var q;
    var qdict;
    while (q = list.pop()) {
        qdict[q.query] = q.id;
    }

    // Run queries and returns the matching query ids:
    var qids = SolrUtils.queryDocument(doc,
            list.map(function (q) { return q.query; })).map(function (query) {
                    return qdict[query];
                    });

    for each (var handler in module.config.handlers) {
        handler.handleDocMatches(id, doc, qids);
    }
}
