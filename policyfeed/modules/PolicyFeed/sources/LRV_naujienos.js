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

exports.name = "LRV_naujienos";
exports.short_name = "LRV-NA";
exports.index_url = "http://www.lrv.lt/rss/rss.php?cats=1-9-3-2-7-6-8-10-11-12-13-14-15-16-17-18-19-20-21-22-23&lang=lt";

exports.doc_template = {
    source: exports.name,
    short_source: exports.short_name
    };


/**
 *
 */
exports.parseIndexItem = function(item)
{
    var result = {
        url:        item.getFirstByXPath("link").asText(),
        title:      item.getFirstByXPath("title").asText(),
        published:  item.getFirstByXPath("pubDate").asText(),
        summary:    item.getFirstByXPath("description").asText()
        };

    result.published = new Date(result.published).format("yyyy-MM-dd HH:mm:ss");
    result.published = result.published.replace(/00:00:00/, new Date().format("HH:mm:ss"));
    
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
        result.title = page.getFirstByXPath('//div[@class="title"]/dl/dt').asText();

    // html:
    var news_div = page.getFirstByXPath('//div[@class="news-view"]');

    var extra_div = false;
    if (extra_div = news_div.getFirstByXPath('./div[@class="title"]'))
        extra_div.remove();
    if (extra_div = page.getElementById("sharesb"))
        extra_div.remove();
    if ((extra_div = news_div.getLastChild()) && extra_div.getTagName && (extra_div.getTagName() == "div"))
        extra_div.remove();

    result.html = news_div.asXml();

    return result;
}
