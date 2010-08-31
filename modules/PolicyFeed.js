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

var fs = require("fs");
var mail = require("ringo/mail");
var JsonStorage = require("ctl/JsonStorage");
var ctlDate = require("ctl/Date");
var SolrClient = require("PolicyFeed/SolrClient");
var ctlTemplate = require("ctl/Template");
var ctlRequest = require("ctl/Request");
var gluestick = require("gluestick");

var Site = gluestick.loadModule("Site");
var WebMapper = gluestick.loadModule("WebMapper");


/**
 *
 */
exports.showDocumentList = function(req)
{
    print("PolicyFeed.showDocumentList", ctlRequest.getRemoteAddr(req));

    var cache_path = "/cache/index";
    if (false) //JsonStorage.exists(cache_path))
        var result = JsonStorage.read(cache_path);
    else
    {
        var {numFound, docs} = SolrClient.getLatestDocs();

        var result = WebMapper.returnHtml(
            this.showContent("showDocumentList", {
                "mode": "list",
                "docs": docs,
                "numFound": numFound
                }));

        //JsonStorage.write(cache_path, result);
    }

    return result;
}


/**
 *
 */
exports.search = function(req)
{
    if (req.params.format && req.params.format == "json")
        return this.loadSearchResults(req);

    print("PolicyFeed.search", req.params.q, ctlRequest.getRemoteAddr(req));

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
    
    return WebMapper.returnHtml(
        this.showContent("search", {
            "query": req.params.q,
            "docs": docs,
            "highlighting": highlighting,
            "numFound": numFound
            }));
}


/**
 *
 */
exports.loadSearchResults = function(req) {
    print("PolicyFeed.search", req.params.q, ctlRequest.getRemoteAddr(req));

    var results = SolrClient.search(req.params.q.trim(), {limit: 20, highlight: true, offset: req.params.offset});
    var docs = [];
    var highlighting = {};

    if (results && results.response) {
        docs = results.response.docs || docs;
    }
    if (results && results.highlighting)
        highlighting = results.highlighting;

    return WebMapper.returnJson({
            docs: docs,
            snippets: highlighting
            });
}


/**
 *
 */
exports.showRss = function(req) {
    
    print("PolicyFeed.showRss", req.params.q, ctlRequest.getRemoteAddr(req));

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

    return {
        status: 200,
        headers: {
            "Content-Type": "application/xml"
        },
        body: [ this.showHtml("showRss", {"docs":docs}) ]
    };
}


/**
 *
 */
exports.showDay = function(req, day)
{
    print("PolicyFeed.showDay", day, ctlRequest.getRemoteAddr(req));
    day = day.replace(/\//g, "-");

    var {docs, numFound} = SolrClient.searchByDay(day).response;

    return WebMapper.returnHtml(
        this.showContent("showDocumentList", {
            "day": day,
            "docs": docs,
            "numFound": numFound
            }));
}


/**
 *
 */
exports.showMonth = function(req, month)
{
    print("PolicyFeed.showMonth", month, ctlRequest.getRemoteAddr(req));
    month = month.replace("/", "-");

    var {docs, numFound} = SolrClient.searchByMonth(month).response;

    return WebMapper.returnHtml(
        this.showContent("showDocumentList", {
            "mode": "search",
            //"query": "Publikuoti:" + month,
            "docs": docs,
            "numFound": numFound
            }));
}


/**
 *
 */
exports.showYear = function(req, year)
{
    print("PolicyFeed.showYear", year, ctlRequest.getRemoteAddr(req));

    var {docs, numFound} = SolrClient.searchByYear(year).response;

    return WebMapper.returnHtml(
        this.showContent("showDocumentList", {
            "mode": "search",
            //"query": "Publikuoti:" + year,
            "docs": docs,
            "numFound": numFound
            }));
}

/**
 *
 */
exports.showDocument = function(req, id)
{
    print("PolicyFeed.showDocument", id, ctlRequest.getRemoteAddr(req));

    var doc = JsonStorage.read(id);
    if (!doc)
        return Site.showError(404);

    if (doc.published.match(/\.\d+Z$/))
        doc.published = ctlDate.fromUTCString(doc.published);

    return {
        status: 200,
        headers: {
            "Content-Type": "text/html; charset=utf-8"
        },
        body: [
            this.showContent("showDocument", {
                "doc": doc
                }) ]};
}


/**
 *
 */
exports.showDocumentFormat = function(req, id, format)
{
    print("PolicyFeed.showDocumentFormat", id, format, ctlRequest.getRemoteAddr(req));

    var doc = JsonStorage.read(id);
    
    if (!doc)
        return Site.showError(404);
    else if (format == "json")
        return WebMapper.returnJson(doc);
    else
        return Site.showError(404);
}


/**
 *
 */
exports.shareByEmail = function(req, id) {
    print("PolicyFeed.shareByEmail", id, req.params.email);

    var doc = JsonStorage.read(id);
    var email = req.params.email;

    mail.send({
        to: email,
        subject: "Nuoroda iš KaVeikiaValdzia.lt: " + doc.title,
        html: this.showHtml("shareByEmail", { doc: doc })
        });

    return {
        status: 200,
        headers: {
            "Content-Type": "text/plain"
        },
        body: [ "OK" ]
    };
}

//----------------------------------------------------------------------------


/**
 *
 */
exports.showSearchBlock = function(query) {
    return this.showHtml("showSearchBlock", { query: query });
}

/**
 *
 */
exports.showContent = function(tpl, content) {
    var tpl_file = fs.directory(module.path) + "/PolicyFeed/tpl/" + tpl + ".ejs";
    return Site.showContent( ctlTemplate.fetchObject(tpl_file, content) );
}


/**
 *
 */
exports.showHtml = function(tpl, content) {
    var tpl_file = fs.directory(module.path) + "/PolicyFeed/tpl/" + tpl + ".ejs";
    return ctlTemplate.fetch(tpl_file, content)
}

