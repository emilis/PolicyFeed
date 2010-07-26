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

var config = getObjectConfig("PolicyFeed") || {};

var WebMapper = loadObject("WebMapper");

var JsonStorage = require("ctl/JsonStorage");
var SolrClient = require("PolicyFeed/SolrClient");

/**
 *
 */
exports.showDocumentList = function(req)
{
    print("PolicyFeed.showDocumentList", loadObject("ctl/Request").getRemoteAddr(req));

    var cache_path = "/cache/index";
    if (false) //JsonStorage.exists(cache_path))
        var result = JsonStorage.read(cache_path);
    else
    {
        //var docs = JsonStorage.iterate("/docs/", { reverse: true, limit: 100});
        //var docs = newObject("PolicyFeed/DocumentList").getLatest(100);
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
    //todo: filter request parameters for invalid input.

    print("PolicyFeed.search", req.params.q, loadObject("ctl/Request").getRemoteAddr(req));

    var results = SolrClient.search(req.params.q.trim());
    var docs = [];
    var numFound = 0;

    if (results && results.response) {
        docs = results.response.docs || docs;
        numFound = results.response.numFound || numFound;
    }
    
    return WebMapper.returnHtml(
        this.showContent("showDocumentList", {
            "mode": "search",
            "query": req.params.q,
            "docs": docs,
            "numFound": numFound
            }));
}


/**
 *
 */
exports.showRss = function(req) {
    
    print("PolicyFeed.showRss", req.params.q, loadObject("ctl/Request").getRemoteAddr(req));

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
        body: [ this.showHtml("showRss", {"docs":docs}).html ]
    };
}


/**
 *
 */
exports.showDay = function(req, day)
{
    print("PolicyFeed.showDay", day, loadObject("ctl/Request").getRemoteAddr(req));
    day = day.replace(/\//g, "-");

    var {docs, numFound} = SolrClient.searchByDay(day).response;

    return WebMapper.returnHtml(
        this.showContent("showDocumentList", {
            "mode": "search",
            //"query": "published:" + day,
            "docs": docs,
            "numFound": numFound
            }));
}


/**
 *
 */
exports.showMonth = function(req, month)
{
    print("PolicyFeed.showMonth", month, loadObject("ctl/Request").getRemoteAddr(req));
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
    print("PolicyFeed.showYear", year, loadObject("ctl/Request").getRemoteAddr(req));

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
    print("PolicyFeed.showDocument", id, loadObject("ctl/Request").getRemoteAddr(req));

    var doc = JsonStorage.read(id);
    if (!doc)
        return this.showError(404);

    return WebMapper.returnHtml(
        this.showContent("showDocument", {
            "doc": doc
            }));
}


/**
 *
 */
exports.showDocumentFormat = function(req, id, format)
{
    print("PolicyFeed.showDocumentFormat", id, format, loadObject("ctl/Request").getRemoteAddr(req));

    var doc = JsonStorage.read(id);
    
    if (!doc)
        return this.showError(404);
    else if (format == "json")
    {
        return {
            status: 200,
            headers: {
                "Content-Type": "application/x-javascript; charset=UTF-8"
            },
            body: [ JSON.stringify(doc) ]
        };
    }
    else
        return this.showError(404);
}

/**
 *
 */
exports.showContent = function(tpl, content) {
    return loadObject("Site").showContent( this.showHtml(tpl, content) );
}


/**
 *
 */
exports.showHtml = function(tpl, content) {
    var template = loadObject("ctl/Template");
    var tpl_file = require("fs").directory(module.path) + "/PolicyFeed/tpl/" + tpl + ".ejs";
    return template.fetchObject(tpl_file, content)
}

/**
 *
 */
exports.showError = function(msg)
{
    var status = 501;
    // if is numeric:
    if (parseInt(msg, 10).toString() == msg.toString())
        status = msg;

    return {
        status: status,
        headers: {},
        body: [ "<h1>Error - " + msg + "</h1>" ]
    };
}

