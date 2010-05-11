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

// Libraries used:
import("core/date");
import("config");

exports.htmlunit = loadObject("htmlunit");


/*
 * These properties should be defined in child objects:
 */
exports.name = "noname";
exports.index_url = "http://www3.lrs.lt/pls/inter/lrs_rss.pranesimai_spaudai";
exports.doc_template = {};


//--- GENERAL FUNCTIONS ------------------------------------------------------

/**
 *
 */
exports.triggerEvent = function(name, data)
{
    return loadObject("Events").create(this.name + ":" + name, data);
}


/**
 *
 */
exports.error = function(name, data)
{
    this.triggerEvent(name + "-error", data);
    return false;
}


/**
 *
 */
exports.getNewOriginal = function()
{
    var doc = newObject("PolicyFeed/OriginalDocument");
    doc.updateFields(this.doc_template);
    return doc;
}


//--- CRAWLING FUNCTIONS -----------------------------------------------------

/**
 * 
 */
exports.downloadNewDocuments = function()
{
    var items = this.removeExistingItems(
                    this.parseIndex(
                        this.htmlunit.getPage(this.index_url, this.name)
                        ));

    var docs = [];
    for (var i=0; i<items.length; i++)
    {
        docs.push(this.downloadPage(items[i]));
    }
    return docs;
}


/**
 * Extracts URLs from index page. By default parses index page as a RSS file.
 */
exports.parseIndex = function(index)
{
    //todo: add checks to ensure that the index is a valid RSS file.

    if (!index.getByXPath)
        return this.error("parseIndex", index); 
    
    var items = index.getByXPath("/rss/channel/item").toArray();
    if (items.length < 1)
        return this.error("parseIndex", "No RSS items found in index.");

    return items.map(this.parseIndexItem);
}


/**
 *
 */
exports.parseIndexItem = function(item)
{
    return {
        url:        item.getFirstByXPath("link").asText(),
        title:      item.getFirstByXPath("title").asText(),
        published:  item.getFirstByXPath("pubDate").asText().replace(/ 00:00/, new Date().format(" HH:mm")),
        summary:    item.getFirstByXPath("description").asText()
        };
}


/**
 *
 */
exports.removeExistingItems = function(items)
{
    var doc = this.getNewOriginal();
    var source_name = this.name;
    if (!items)
        return items;
    else
        return items.filter(function (item)
        {
            return !doc.searchBySourceAndUrl(source_name, item.url);
        });
}


/**
 *
 */
exports.downloadPage = function(item)
{
    this.triggerEvent("downloadPage-debug", item.url);

    var doc = this.getNewOriginal();
    doc.updateFields(item);

    var page = this.htmlunit.getPage(item.url, this.name);
    var response = page.getWebResponse();
    var content_type = response.getContentType();

    // DOC files, etc.:
    if (page instanceof com.gargoylesoftware.htmlunit.UnexpectedPage)
    {
        var stream = new (require("io").Stream)(response.getContentAsStream());
        doc.setFieldsFromStream(stream, content_type);
    }
    // Sgml page is parent class for HtmlPage, XmlPage and XhtmlPage.
    else if (page instanceof com.gargoylesoftware.htmlunit.SgmlPage)
    {
        this.htmlunit.setPageCharset(page, "UTF-8");
        doc.html = page.asXml();
        doc.meta.content_type = content_type;
    }
    else
    {
        return this.error("downloadPage", ["Unsupported page type for", item]);
    }

    doc.save();

    return doc;
}


//--- CONVERTER METHODS ------------------------------------------------------


/**
 *
 */
exports.extractDocumentData = function(doc)
{
    return {};
}

