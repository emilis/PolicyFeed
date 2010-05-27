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

var jstorage = require("ctl/JsonStorage");
var search = require("PolicyFeed/SolrClient");

/**
 *
 */
exports.showDocumentList = function(req)
{
    print("PolicyFeed.showDocumentList", loadObject("ctl/Request").getRemoteAddr(req));

    var cache_path = "/cache/index";
    if (false) //jstorage.exists(cache_path))
        var result = jstorage.read(cache_path);
    else
    {
        //var docs = jstorage.iterate("/docs/", { reverse: true, limit: 100});
        //var docs = newObject("PolicyFeed/DocumentList").getLatest(100);
        var docs = search.getLatestDocs();

        var result = WebMapper.returnHtml(
            this.showContent("showDocumentList", {
                "mode": "list",
                "docs": docs
                }));

        //jstorage.write(cache_path, result);
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

    var results = search.search(req.params.q.trim());
    var docs = [];

    if (results && results.response && results.response.docs)
        docs = results.response.docs;
    
    return WebMapper.returnHtml(
        this.showContent("showDocumentList", {
            "mode": "search",
            "query": req.params.q,
            "docs": docs
            }));
}


/**
 *
 */
exports.showDay = function(req, day)
{
    print("PolicyFeed.showDay", day, loadObject("ctl/Request").getRemoteAddr(req));
    day = day.replace(/\//g, "-");

    var docs = search.searchByDay(day).response.docs;

    return WebMapper.returnHtml(
        this.showContent("showDocumentList", {
            "mode": "search",
            "query": "Publikuoti:" + day,
            "docs": docs
            }));
}


/**
 *
 */
exports.showMonth = function(req, month)
{
    print("PolicyFeed.showMonth", month, loadObject("ctl/Request").getRemoteAddr(req));
    month = month.replace("/", "-");

    var docs = search.searchByMonth(month).response.docs;

    return WebMapper.returnHtml(
        this.showContent("showDocumentList", {
            "mode": "search",
            "query": "Publikuoti:" + month,
            "docs": docs
            }));
}


/**
 *
 */
exports.showYear = function(req, year)
{
    print("PolicyFeed.showYear", year, loadObject("ctl/Request").getRemoteAddr(req));

    var docs = search.searchByYear(year).response.docs;

    return WebMapper.returnHtml(
        this.showContent("showDocumentList", {
            "mode": "search",
            "query": "Publikuoti:" + year,
            "docs": docs
            }));
}

/**
 *
 */
exports.showDocument = function(req, id)
{
    print("PolicyFeed.showDocument", id, loadObject("ctl/Request").getRemoteAddr(req));

    var doc = jstorage.read(id);
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

    var doc = jstorage.read(id);
    
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
exports.showContent = function(tpl, content)
{
    var template = loadObject("ctl/Template");
    var tpl_file = require("fs").directory(module.path) + "/PolicyFeed/tpl/" + tpl + ".ejs";

    return loadObject("Site").showContent(
        template.fetchObject(tpl_file, content) );
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

