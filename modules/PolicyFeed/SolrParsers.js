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

var config = require("config");
var fs = require("fs");
var ctlString = require("ctl/String");

var SEARCH_DIR = config.WEB_DIR + "/search";

// --- init ------------------------------------------------------------------

var solrconfig = fs.open(SEARCH_DIR + "/conf/solrconfig.xml", {read: true, binary: true})
var sc = new org.apache.solr.core.SolrConfig(SEARCH_DIR, "config", solrconfig)

var schema = fs.open(SEARCH_DIR + "/conf/schema.xml", {read: true, binary: true})
var is = new org.apache.solr.schema.IndexSchema(sc, "schema", schema)

var sqp = new org.apache.solr.search.SolrQueryParser(is, "html")

var a = is.getAnalyzer()


// --- functions -------------------------------------------------------------

/**
 *
 */
exports.parseQuery = function(query) {
    return sqp.parse(query);
}


/**
 *
 */
exports.tokenizeText = function(text) {
    return a.tokenStream("html", java.io.StringReader( text ));
}


/**
 *
 */
exports.tokenizeHtml = function(html) {
    return this.tokenizeText(
            ctlString.jreg_replace("<[^>]+>", " ", html));
}

/**
 *
 */
exports.htmlToArray = function(html) {
    var tokens = this.tokenizeHtml(html);
    var term = false;
    var a = [];
    while (term = tokens.next()) {
        a.push(term.termText());
    }
    return a;
}


/**
 *
 */
exports.htmlToDict = function(html) {
    var tokens = this.tokenizeHtml(html);
    var term = false;
    var dict = {};
    while (term = tokens.next()) {
        dict[term.termText()] = true;
    }
    return dict;
   
}
