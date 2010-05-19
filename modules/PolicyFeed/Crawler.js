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


importClass(java.lang.Thread,
            java.lang.Runnable);

exports.config = getObjectConfig("PolicyFeed/Crawler");


/**
 *
 */
exports.triggerEvent = function(name, data)
{
    return loadObject("Events").create("PolicyFeed/Crawler:" + name, data);
}


/**
 *
 */
exports.webCrawl = function(req)
{

    // Check if IP is allowed to access this function:
    var jsr = req.env["jsgi.servlet_request"];
    var ip = jsr.getHeader("X-Real-IP") || jsr.getRemoteAddr();
    if (this.config.allowed_ips.indexOf(ip) == -1)
    {
        this.triggerEvent("webCrawl-security-error", ip);
        return {
            status: 403,
            headers: {},
            body: []
        };
    }

    this.crawl();

    return {
        status: 200,
        headers: {},
        body: ["OK"]
    };
}


/**
 *
 */
exports.crawl = function()
{
    this.triggerEvent("crawl-debug", "Started.");

    // Download source documents:
    var sources = loadObject("PolicyFeed/SourceList").list;
    for each (var source in sources)
    {
        /*
        var r = new Runnable() {
            run: function() {
            */
        try {
            source.downloadNewDocuments();
        }
        catch (err)
        {
            this.triggerEvent("crawl-source-error", [source.name, err]);
        }
                /*
                return true;
            }
        };
        new Thread(r).start();
        */
    }

    this.triggerEvent("crawl-debug", "Finished.");
}


/**
 *
 */
exports.regetDocument = function(doc)
{
    // get Document:
    if (typeof(doc) == "number")
    {
        var id = doc;
        doc = newObject("PolicyFeed/Document");
        doc.read(id);
    }

    this.regetOriginal(doc.original_id);

    return loadObject("PolicyFeed/Converter").reconvertDocument(doc);
}


/**
 *
 */
exports.regetOriginal = function(original)
{
    // get OriginalDocument:
    if (typeof(original) == "number")
    {
        var id = original;
        original = newObject("PolicyFeed/OriginalDocument");
        original.read(id);
    }

    // get Source instance:
    var source = loadObject("PolicyFeed/sources/" + original.source);

    // get original
    return source.downloadPage(original.toObject());
}
