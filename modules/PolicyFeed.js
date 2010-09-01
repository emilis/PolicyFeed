/*
    Copyright 2009,2010 Emilis Dambauskas

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
var gluestick = require("gluestick");
var fs = require("fs");
var mail = require("ringo/mail");
var JsonStorage = require("ctl/JsonStorage");
var ctlDate = require("ctl/Date");
var SolrClient = require("PolicyFeed/SolrClient");


// Extend module:
gluestick.extendModule(exports, "ctl/Controller");

/**
 * Directory with template files.
 */
exports.tpl_dir = exports.getTplDir(module);


/**
 * Prints request params to output.
 */
function log_request(method, req, params) {
    if (params)
        print(module.id, method, params, exports.ctlRequest.getRemoteAddr(req));
    else
        print(module.id, method, exports.ctlRequest.getRemoteAddr(req));
}


/**
 *
 */
exports.showDocumentList = function(req) {
    log_request("showDocumentList", req);

    var {numFound, docs} = SolrClient.getLatestDocs();

    return this.returnHtml("showDocumentList", {
            "mode": "list",
            "docs": docs,
            "numFound": numFound
            });
}


/**
 *
 */
exports.search = function(req) {
    if (req.params.format && req.params.format == "json")
        return this.loadSearchResults(req);

    log_request("search", req, req.params.q);

    var results = SolrClient.search(req.params.q.trim(), {limit: 20, highlight: true});
    var docs = [];
    var numFound = 0;
    var highlighting = {};

    if (results && results.response) {
        docs = results.response.docs || docs;
        numFound = results.response.numFound || numFound;
    }
    if (results && results.highlighting)
        highlighting = results.highlighting;
    
    return this.returnHtml("search", {
            "query": req.params.q,
            "docs": docs,
            "highlighting": highlighting,
            "numFound": numFound
            });
}


/**
 *
 */
exports.loadSearchResults = function(req) {
    log_request("search", req, req.params.q);

    var results = SolrClient.search(req.params.q.trim(), {limit: 20, highlight: true, offset: req.params.offset});
    var docs = [];
    var highlighting = {};

    if (results && results.response) {
        docs = results.response.docs || docs;
    }
    if (results && results.highlighting)
        highlighting = results.highlighting;

    return this.WebMapper.returnJson({
            docs: docs,
            snippets: highlighting
            });
}


/**
 *
 */
exports.showRss = function(req) {

    log_request("showRss", req, req.params.q);

    var search_options =  {limit: 20, fields: ["id","published","type","org","title","html"]};
    var query = "*:*";
    if (req.params.q)
        query = req.params.q.trim()

    var results = SolrClient.search(query, search_options);

    var docs = [];
    var numFound = 0;
    if (results && results.response) {
        var {docs, numFound} = results.response;
    }

    for (var i in docs) {
        var doc = JsonStorage.read(docs[i].id);
        docs[i].html = doc.html;
    }

    return this.WebMapper.returnResponse({
        headers: { "Content-Type": "application/xml" },
        body: [ this.showHtml("showRss", {"docs":docs}) ]
    });
}


/**
 *
 */
exports.showDay = function(req, day) {
    log_request("showDay", req, day);

    day = day.replace(/\//g, "-");

    var {docs, numFound} = SolrClient.searchByDay(day).response;

    return this.returnHtml("showDocumentList", {
            "docs": docs,
            "numFound": numFound
            });
}


/**
 *
 */
exports.showMonth = function(req, month) {
    log_request("showMonth", req, month);
    
    month = month.replace("/", "-");

    var {docs, numFound} = SolrClient.searchByMonth(month).response;

    return this.returnHtml("showDocumentList", {
            "mode": "search",
            "docs": docs,
            "numFound": numFound
            });
}


/**
 *
 */
exports.showYear = function(req, year) {
    log_request("showYear", req, year);

    var {docs, numFound} = SolrClient.searchByYear(year).response;

    return this.returnHtml("showDocumentList", {
            "mode": "search",
            "docs": docs,
            "numFound": numFound
            });
}

/**
 *
 */
exports.showDocument = function(req, id) {
    log_request("showDocument", req, id);

    var doc = JsonStorage.read(id);
    if (!doc)
        return this.showError(404);

    if (doc.published.match(/\.\d+Z$/))
        doc.published = ctlDate.fromUTCString(doc.published);

    return this.returnHtml("showDocument", {
            doc: doc
            });
}


/**
 *
 */
exports.showDocumentFormat = function(req, id, format) {
    log_request("showDocumentFormat", req, [id, format]);

    var doc = JsonStorage.read(id);
    
    if (!doc)
        return this.showError(404);
    else if (format == "json")
        return this.WebMapper.returnJson(doc);
    else
        return this.showError(404);
}


/**
 *
 */
exports.shareByEmail = function(req, id) {
    log_request("shareByEmail", req, [id, req.params.email]);

    var doc = JsonStorage.read(id);
    var email = req.params.email;

    mail.send({
        to: email,
        subject: "Nuoroda iš KaVeikiaValdzia.lt: " + doc.title,
        html: this.showHtml("shareByEmail", { doc: doc })
        });

    return this.WebMapper.returnJson({message: "OK"});
}

//----------------------------------------------------------------------------


/**
 *
 */
exports.showSearchBlock = function(query) {
    return this.showHtml("showSearchBlock", { query: query });
}

