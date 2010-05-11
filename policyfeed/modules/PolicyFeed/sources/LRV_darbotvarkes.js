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

require("core/date");

// Extends:
exports.extendObject("PolicyFeed/Source");

exports.name = "LRV_darbotvarkes";
exports.short_name = "LRV-DB";
exports.index_url = [
    // reverse order (not to miss if something changes while scrapping):
    "http://www.lrv.lt/lt/veikla/darbotvarkes/?p=5",
    "http://www.lrv.lt/lt/veikla/darbotvarkes/?p=4",
    "http://www.lrv.lt/lt/veikla/darbotvarkes/?p=3",
    "http://www.lrv.lt/lt/veikla/darbotvarkes/?p=2",
    "http://www.lrv.lt/lt/veikla/darbotvarkes/?p=1"
    ];

exports.doc_template = {
    source: exports.name,
    short_source: exports.short_name
    };

//------------------------------------------------------------------------

/**
 * 
 */
exports.downloadNewDocuments = function()
{
    var items = [];
    for (var i=0; i<this.index_url.length; i++)
    {
        items = items.concat(
                this.removeExistingItems(
                    this.parseIndex(
                        this.htmlunit.getPage( this.index_url[i], this.name ))));
    }

    var docs = [];
    for (var i=0; i<items.length; i++)
    {
        docs.push(this.downloadPage(items[i]));
    }
    return docs;
}


/**
 *
 */
exports.parseIndex = function(index)
{
    if (!index.getByXPath)
        return this.error("parseIndex", index); 
    
    var items = index.getByXPath('//div[@class="agenda-list"]').toArray();
    if (items.length < 1)
        return this.error("parseIndex", "No items found in index.");

    return items.map(this.parseIndexItem);
}


exports.parseIndexItem = function(item)
{
    var i_link = './dl[2]/dt/a';
    var i_date = './dl[1]';
    var i_doc  = './dl[2]//dd[@class="doc"]/a';

    i_link = item.getFirstByXPath(i_link);
    i_date = item.getFirstByXPath(i_date);
    i_doc  = item.getFirstByXPath(i_doc);

    if (i_doc)
        var url = i_doc.getHrefAttribute();
    else
        var url = i_link.getHrefAttribute();

    if (url[0] == '/')
        url = "http://www.lrv.lt" + url;
    //todo: check for non-root urls.

    var year = i_date.getFirstByXPath('./dd[1]').asText();
    var month = i_date.getFirstByXPath('./dd[2]').asText();
    var day = i_date.getFirstByXPath('./dd[3]').asText();
    var wday = i_date.getFirstByXPath('./dd[4]').asText();

    var lt_months = {
        "sausio":   "01",
        "vasario":  "02",
        "kovo":     "03",
        "balandžio":"04",
        "gegužės":  "05",
        "birželio": "06",
        "liepos":   "07",
        "rugpjūčio":"08",
        "rugsėjo":  "09",
        "spalio":   "10",
        "lapkričio":"11",
        "gruodžio": "12"
    };
    if (lt_months[month])
        month = lt_months[month];
    else
        loadObject("Events").create("PolicyFeed/sources/LRV_darbotvarkes:parseIndex-warning", ["Unknown month", month]);

    day = "" + year + "-" + month + "-" + day.split(" ")[0] + " (" + wday + ") " ;

    var result = {
        url: url,
        title: day + i_link.asText(),
        published: new Date().format("yyyy-MM-dd HH:mm:ss"),
        summary: ""
    };

    return result;
}



/**
 *
 */
exports.extractDocumentData = function(doc)
{
    if (doc.meta.converted_by)
        return false;

    var page = this.htmlunit.getPageFromHtml(doc.html, doc.meta.url, this.name);
    this.htmlunit.fixPageUrls(page);
    var result = {};

    // title:
    if (!doc.meta.title)
        result.title = page.getFirstByXPath('//div[@id="text"]/p[2]').asText();

    // html:
    var text = page.getElementById("text");

    var extra_div = false;
    if (extra_div = page.getElementById("add-links"))
        extra_div.remove();
    if (extra_div = text.getFirstByXPath('./p[1]'))
        extra_div.remove();
    if (extra_div = text.getFirstByXPath('./p[1]'))
        extra_div.remove();
    if ((extra_div = text.getLastChild()) && extra_div.getTagName && (extra_div.getTagName() == "div"))
        extra_div.remove();
   
    result.html = text.asXml();

    return result;
}
