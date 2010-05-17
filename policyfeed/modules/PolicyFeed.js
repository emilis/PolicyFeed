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


/**
 *
 */
exports.showDocumentList = function(req)
{
    print("PolicyFeed.showDocumentList", loadObject("ctl/Request").getRemoteAddr(req));



    return WebMapper.returnHtml(
        this.showContent("showDocumentList", {
            "mode": "list",
            //"docs": loadObject("ctl/JsonStorage").iterate("/docs/", { reverse: true, limit: 100})
            "docs": newObject("PolicyFeed/DocumentList").getLatest(100)
            }));
}


/**
 *
 */
exports.showListByDate = function(req, day)
{
    print("PolicyFeed.showListByDate", day, loadObject("ctl/Request").getRemoteAddr(req));

    return WebMapper.returnHtml(
        this.showContent("showDocumentList", {
            "mode": "byDate",
            "date": day,
            "docs": newObject("PolicyFeed/DocumentList").getByDate(day)
            }));
}


/**
 *
 */
exports.search = function(req)
{
    print("PolicyFeed.search", req.params.q, loadObject("ctl/Request").getRemoteAddr(req));

    return WebMapper.returnHtml(
        this.showContent("showDocumentList", {
            "mode": "search",
            "query":req.params.q,
            "docs": newObject("PolicyFeed/DocumentList").search(req.params.q)
            }));
}


/**
 *
 */
exports.showDocument = function(req, id)
{
    print("PolicyFeed.showDocument", id, loadObject("ctl/Request").getRemoteAddr(req));

    if (id.indexOf("/") > -1)
    {
        var doc = loadObject("ctl/JsonStorage").read("/docs/" + id + "/doc");
        if (!doc)
            return "404 - Document not found.";
    }
    else
    {
        var doc = newObject("PolicyFeed/Document");
        if (!doc.read(id))
            return "404 - Document not found.";
    }


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

    var doc = newObject("PolicyFeed/Document");
    
    if (!doc.read(id))
        return this.showError(404);
    else if (format == "json")
    {
        return {
            status: 200,
            headers: {
                "Content-Type": "application/x-javascript; charset=UTF-8"
            },
            body: [ doc.toString() ]
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
    // if is numeric:
    if (parseInt(msg, 10).toString() == msg.toString())
    {
        WebMapper.header("Status: " + msg);
        return "<h1>Error " + msg + "</h1>";
    }
    else
        return "<h1>Error " + msg + "<h1>";

}

