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

var sources = newObject("PolicyFeed/SourceList").list;
var filters = newObject("PolicyFeed/FilterList");


exports.config = getObjectConfig("PolicyFeed/Converter");

/**
 *
 */
exports.triggerEvent = function(name, data)
{
    name = "PolicyFeed/Converter:" + name;
    return loadObject("Events").create(name, data);
}


/**
 *
 */
exports.webConvert = function(req)
{
    // Check if IP is allowed to access this function:
    var jsr = req.env["jsgi.servlet_request"];
    var ip = jsr.getHeader("X-Real-IP") || jsr.getRemoteAddr();
    if (this.config.allowed_ips.indexOf(ip) == -1)
    {
        this.triggerEvent("webConvert-security-error", ip);
        return {
            status: 403,
            headers: {},
            body: []
        };
    }
   
    this.convert();
   
    return {
        status: 200,
        headers: {},
        body: ["OK"]
    };
}


/**
 *
 */
exports.convert = function()
{
    this.triggerEvent("convert-debug", "Started.");

    // Convert documents:
    var converted = 0;
    var failed = 0;
    for each (var original in newObject("PolicyFeed/OriginalDocumentList").selectUnconverted())
    {
        if (!original.isConverted())
        {
            if (this.convertDocument( this.originalToDoc(original) ))
                converted++;
            else
                failed++;
        }
    }

    // Report errors:
    if (failed > 0)
        this.triggerEvent("convert-error", "Failed to convert " + failed + " documents.");

    this.triggerEvent("convert-info", "Failed/converted: " + failed + "/" + converted + ".");
}


/**
 *
 */
exports.reconvertDocument = function(doc)
{
    // get Document object:
    if (typeof(doc) == "number")
    {
        var id = doc;
        doc = newObject("PolicyFeed/Document");
        doc.read(id);
    }

    // get OriginalDocument object:
    var original = newObject("PolicyFeed/OriginalDocument");
    original.read(doc.original_id);
    
    // re-assign fields from original to doc:
    doc.published = original.published;
    doc.meta = original.meta;
    doc.meta.source = original.source;
    doc.meta.url = original.url;
    doc.html = original.html;

    return this.convertDocument(doc);
}


/**
 *
 */
exports.originalToDoc = function(original)
{
    var doc = newObject("PolicyFeed/Document");
    doc.assignFields(original.toObject());
    doc.id = false; // reset id
    doc.original_id = original.id;
    return doc;
}


/**
 *
 */
exports.convertDocument = function(doc)
{
    try {
        exports.triggerEvent("convertDocument-debug", [doc.original_id, doc.meta.url, doc.meta.title]);
        doc.updateFields( sources[doc.meta.source].extractDocumentData(doc) );
        doc.updateFields( filters.processDocument(doc) );
        return doc.save();
    } catch (err) {
        exports.triggerEvent("convertDocument-error", ["Failed to update document", err, doc]);
        return false;
    }
}

