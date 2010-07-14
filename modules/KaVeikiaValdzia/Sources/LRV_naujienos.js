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

// --- Requirements: ---
require("core/date");
var UrlList = require("PolicyFeed/UrlList");
var UrlQueue = require("PolicyFeed/UrlQueue");
var JsonStorage = require("ctl/JsonStorage");
var Sequence = require("ctl/SimpleSequence");
var htmlunit = require("htmlunit");


// --- Source config: ---
exports.feed_url = "http://www.lrv.lt/rss/rss.php?cats=1-9-3-2-7-6-8-10-11-12-13-14-15-16-17-18-19-20-21-22-23&lang=lt";

exports.doc_template = {
    type: "pranesimas",
    org: "Vyriausybė",
    organization: "Lietuvos Respublikos Vyriausybė"
};

// --- API: ---

/**
 *
 */
exports.checkFeed = function(url, page) {
    this.validateFeedPage(page);

    this.extractFeedItems(page).map(this.parseFeedItem()).filter(this.removeExisting).map(this.addPageUrls);

    // schedule next check:
    UrlQueue.scheduleUrl(url, new Date(new Date().getTime() + 5*60*1000));
}

/**
 *
 */
exports.parsePage = function(url, page) {
    return this.updateDoc(this.updateOriginal(url, page), url, page);
}



// --- Other methods: ---

/**
 *
 */
exports.error = function(method, msg) {
    return Error(this.name + "." + method + " Error: " + msg);
}


/**
 *
 */
exports.validateFeedPage = function(page) {
    //todo: add checks to ensure that the feed is a valid RSS file.

    if (!page.getByXPath)
        throw this.error("validateFeedPage", page);
}


/**
 *
 */
exports.extractFeedItems = function (page) {
    var items = page.getByXPath("/rss/channel/item").toArray();
    if (items.length < 1)
        throw this.error("extractFeedItems", "No RSS items found in feed.");

    return items;
}


/**
 *
 */
exports.parseFeedItem = function() {
    var name = this.name;
    var doc_template = this.doc_template;
    return function (item) {
        var result = {
            url:        item.getFirstByXPath("link").asText(),
            title:      item.getFirstByXPath("title").asText(),
            published:  item.getFirstByXPath("pubDate").asText(),
            summary:    item.getFirstByXPath("description").asText()
            };

        result.published = new Date(result.published).format("yyyy-MM-dd HH:mm:ss");
        result.published = result.published.replace(/00:00:00/, new Date().format("HH:mm:ss"));

        result.source = name;
        for (var k in doc_template)
            result[k] = doc_template[k];

        return result;
    }
}


/**
 *
 */
exports.removeExisting = function(item) {
    if (UrlList.exists(item.url))
        return false;
    else
        return true;
}


/**
 *
 */
exports.addPageUrls = function(item) {
    // create originals:
    var id = "/originals/" + item.published.substr(0, 10).replace(/-/g, "/") + "/";
    id += Sequence.next();

    print("adding page:", id, item.published, item.url, item.title);

    JsonStorage.write(id, item);
    UrlList.addUrl(item.url, id);

    UrlQueue.addUrl({
        url: item.url,
        source: this.name,
        method: "parsePage",
        original_id: id
        });
}


/**
 *
 */
exports.updateOriginal = function(url, page) {
    var original = JsonStorage.read(url.original_id);

    var response = page.getWebResponse();
    original.content_type = response.getContentType();

    // Sgml page is parent class for HtmlPage, XmlPage and XhtmlPage.
    if (page instanceof com.gargoylesoftware.htmlunit.SgmlPage)
    {
        htmlunit.setPageCharset(page, "UTF-8");
        original.html = page.asXml();
    }
    else
        throw this.error("updateOriginal", url.original_id + " | " + url.url);

    // save original:
    JsonStorage.write(original._id, original);

    return original;
}


/**
 *
 */
exports.updateDoc = function(original, url, page) {
    // create doc from original:
    var doc = original;
    doc._id = doc._id.replace("originals", "docs");

    // Warning: No updates to original after this point or you'll regret it.

    htmlunit.fixPageUrls(page);

    // title:
    if (!doc.title)
        doc.title = page.getFirstByXPath('//div[@class="title"]/dl/dt').asText();

    // html:
    var news_div = page.getFirstByXPath('//div[@class="news-view"]');

    var extra_div = false;
    if (extra_div = news_div.getFirstByXPath('./div[@class="title"]'))
        extra_div.remove();
    if (extra_div = page.getElementById("sharesb"))
        extra_div.remove();
    if ((extra_div = news_div.getLastChild()) && extra_div.getTagName && (extra_div.getTagName() == "div"))
        extra_div.remove();

    doc.html = news_div.asXml();

    // save doc:
    JsonStorage.write(doc._id, doc);

    return doc;
}
