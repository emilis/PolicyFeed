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
var ctl_dates = require("ctl/utils/dates");
var ctl_strings = require("ctl/utils/strings");

var SEARCH_DIR = config.DIRS.root + "/search";

// --- init ------------------------------------------------------------------

var solrconfig = fs.open(SEARCH_DIR + "/conf/solrconfig.xml", {read: true, binary: true})
exports.SolrConfig = new org.apache.solr.core.SolrConfig(SEARCH_DIR, "config", solrconfig)

var schema = fs.open(SEARCH_DIR + "/conf/schema.xml", {read: true, binary: true})
exports.IndexSchema = new org.apache.solr.schema.IndexSchema(exports.SolrConfig, "schema", schema)

exports.SolrQueryParser = new org.apache.solr.search.SolrQueryParser(exports.IndexSchema, "html")
exports.SolrQueryParser.setDefaultOperator(org.apache.lucene.queryParser.QueryParser.Operator.AND);

exports.Analyzer = exports.IndexSchema.getAnalyzer();


// --- functions -------------------------------------------------------------

/**
 *
 */
exports.parseQuery = function(query) {
    return this.SolrQueryParser.parse(query);
}


/**
 *
 */
exports.showQuery = function(query) {
    if (query.class == org.apache.lucene.search.TermQuery) {
        return query.getTerm().text();
    } else if (query.class == org.apache.lucene.search.PhraseQuery) {
        return ["SEQ",  query.getTerms().map(function (item) { return item.text(); }).join(" ")];
    } else if (query.class == org.apache.lucene.search.BooleanQuery) {
        var a = query.getClauses().map(exports.showQuery);
        a.unshift("BOOL");
        return a;
    } else if (query.class == org.apache.lucene.search.BooleanClause) {
        var prefix = "CLAUSE:";
        if (query.required)
            prefix += "REQ";
        if (query.prohibited)
            prefix += "NOT";

        return [prefix, exports.showQuery(query.getQuery())];
    } else {
        throw Error("Unknown query class " + query.class);
    }
}


/**
 *
 */
exports.queryDocument = function(doc, queries) {
    var mi = new org.apache.lucene.index.memory.MemoryIndex();

    // Add document fields:
    mi.addField("id", doc.id, this.Analyzer);
    mi.addField("published", ctl_dates.formatFromString(doc.published, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"), this.Analyzer);
    mi.addField("type", doc.type, this.Analyzer);
    mi.addField("org", doc.org, this.Analyzer);
    mi.addField("organization", doc.organization, this.Analyzer);
    mi.addField("title", doc.title, this.Analyzer);

    if (!doc.text)
        mi.addField("html", this.tokenizeHtml(doc.html));
    else
        mi.addField("html", doc.text, this.Analyzer);

    // Run queries and return the matching ones:
    return queries.filter(function (query) {
            if (!query) {
                return false;
            } else if (typeof(query) == "string") {
                try {
                    query = exports.parseQuery(query);
                    return mi.search(query);
                } catch (e) {
                    return false;
                }
            } else {
                return mi.search(query);
            }
        });
}


/**
 *
 */
exports.tokenizeText = function(text) {
    return this.Analyzer.tokenStream("html", java.io.StringReader( text ));
}


/**
 *
 */
exports.tokenizeHtml = function(html) {
    return this.tokenizeText(
            ctl_strings.jreg_replace("<[^>]+>", " ", html));
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
