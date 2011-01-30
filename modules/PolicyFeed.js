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
var config = require("config");
var ctl_dates = require("ctl/utils/dates");
var fs = require("fs");
var gluestick = require("gluestick");
var jsonfs = require("ctl/objectfs/json");
var mail = require("ringo/mail");
var SolrClient = require("PolicyFeed/Solr/Client");
var Users = require("PolicyFeed/Users");


// Extend module:
gluestick.extendModule(exports, "ctl/Controller");

/**
 * Directory with template files.
 */
exports.tpl_dir = exports.getTplDir(module);


var log = require("ringo/logging").getLogger(module.id);


/**
 * Prints request params to output.
 */
function log_request(method, req, params) {
    if (params)
        log.info(method, params, exports.ctlRequest.getRemoteAddr(req));
    else
        log.info(method, exports.ctlRequest.getRemoteAddr(req));
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
    if (req.params.format) {
        if (req.params.format == "json") {
            return this.loadSearchResults(req);
        } else if (req.params.format == "embedded") {
            return this.embedSearchResults(req);
        }
    }

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
exports.embedSearchResults = function(req) {
    log_request("search", req, req.params.q);

    var limit = 20;
    var results = SolrClient.search(req.params.q.trim(), {limit: limit, highlight: false});
    var docs = [];
    var numFound = 0;

    if (results && results.response) {
        docs = results.response.docs || docs;
        numFound = results.response.numFound || numFound;
    }
    
    return this.WebMapper.returnHtml(
            this.showHtml("embedSearchResults", {
                "query": req.params.q,
                "docs": docs,
                "numFound": numFound,
                "limit": limit
        }));
}


/**
 *
 */
exports.showRss = function(req) {

    log_request("showRss", req, req.params.q);

    var search_options =  {limit: 20, fields: ["id","published","type","org","title","html"]};
    var query = "orgroups:LT";
    if (req.params.q)
        query = req.params.q.trim()

    var results = SolrClient.search(query, search_options);

    var docs = [];
    var numFound = 0;
    if (results && results.response) {
        var {docs, numFound} = results.response;
    }

    for (var i in docs) {
        var doc = jsonfs.read(docs[i].id);
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

    var doc = jsonfs.read(id);
    if (!doc)
        return this.showError(404);

    if (doc.published.match(/\.\d+Z$/))
        doc.published = ctl_dates.fromUTCString(doc.published);

    return this.returnHtml("showDocument", {
            doc: doc
            });
}


/**
 *
 */
exports.showDocumentFormat = function(req, id, format) {
    log_request("showDocumentFormat", req, [id, format]);

    var doc = jsonfs.read(id);
    
    if (!doc)
        return this.showError(404);
    else if (format == "json")
        return this.WebMapper.returnJson(doc);
    else if (format == "html")
        return this.WebMapper.returnHtml(this.showHtml("showDocumentFormat-html", { doc: doc }));
    else
        return this.showError(404);
}


/**
 *
 */
exports.shareByEmail = function(req) {
    log_request("shareByEmail", req, [req.params.doc_id, req.params.email]);

    var email = req.params.email;
    var id = req.params.doc_id;
    var user;

    if (!(user = Users.read({email: email}))) {
        var uid = Users.create(false, { email: email, blocked: false });
        user = Users.read(uid);
    }

    if (user.blocked) {
        return this.WebMapper.returnJson({ message: '<p class="error">Atsiprašome, bet <a href="mailto:' + email + '">' + email + '</a> savininkas nepageidauja gauti pranešimų iš mūsų svetainės.</p><p><em>Jei jūs esate šio el. pašto adreso savininkas ir norite pakeisti savo pasirinkimą, prašome <a href="mailto:' + config.supportEmail + '">parašyti mums</a>.' });
    } else if (!jsonfs.exists(id)) {
        log.error("shareByEmail", "The document does not exist:", id);
        return this.WebMapper.returnJson({ message: '<p class="error">Atsiprašome, bet mūsų sistema nerado tokio dokumento. Administratoriai informuoti apie įvykį.</p>' });
    } else {
        var doc = jsonfs.read(id);

        mail.send({
            to: email,
            subject: "Nuoroda iš KaVeikiaValdzia.lt: " + doc.title,
            html: this.showHtml("shareByEmail", { doc: doc, key: user.key })
            });

        return this.WebMapper.returnJson({message: '<p class="ok">Pranešimas išsiųstas adresu <a href="mailto:' + email + '">' + email + '</a>.</p>'});
    }
}

//----------------------------------------------------------------------------


/**
 *
 */
exports.showSearchBlock = function(query) {
    return this.showHtml("showSearchBlock", { query: query });
}

