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

var UrlQueue = require("PolicyFeed/UrlQueue");
var UrlList = require("PolicyFeed/UrlList");

var JsonStorage = require("ctl/JsonStorage");
var Sequence = require("ctl/SimpleSequence");

var htmlunit = require("htmlunit");

/**
 *
 */
exports.checkFeed = function(url, page) {
    this.validateFeedPage(page);

    this.extractFeedItems(page).map(this.parseFeedItem()).filter(this.removeExisting).map(this.addPageUrls());

    // schedule next check:
    UrlQueue.scheduleUrl(url, new Date(new Date().getTime() + 5*60*1000));
}

/**
 *
 */
exports.parsePage = function(url, page) {
    return this.updateDoc(this.updateOriginal(url, page), page);
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
    else
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
exports.addPageUrls = function() {
    var name = this.name;

    return function (item) {
        // create originals:
        var id = "/originals/" + item.published.substr(0, 10).replace(/-/g, "/") + "/";
        id += Sequence.next();

        print("adding page:", id, item.published, item.url, item.title);

        JsonStorage.write(id, item);
        UrlList.addUrl(item.url, id);

        UrlQueue.addUrl({
            url: item.url,
            source: name,
            method: "parsePage",
            original_id: id
            });
    }
}


/**
 *
 */
exports.updateOriginal = function(url, page) {
    var original = JsonStorage.read(url.original_id);

    var response = page.getWebResponse();
    original.content_type = response.getContentType();

    // DOC files, etc.:
    if (page instanceof com.gargoylesoftware.htmlunit.UnexpectedPage) {
        var stream = new (require("io").Stream)(response.getContentAsStream());
        var fields = this.getFieldsFromStream(stream, content_type);
        for (var key in fields)
            original[key] = fields[key];
    }
    // Sgml page is parent class for HtmlPage, XmlPage and XhtmlPage.
    if (page instanceof com.gargoylesoftware.htmlunit.SgmlPage) {
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
exports.getFieldsFromStream = function(stream, content_type) {
    var fields = {};
    fields.content_type = content_type;

    // requirements to save file:
    import("fs");
    import("core/date");
    import("config");

    var data_dir = require("config").DATA_DIR + "/temp";
    var id = Math.random();

    // save file:
    var dir_name = data_dir + (new Date().format("/yyyy/MM/dd"));
    if (!fs.exists(dir_name))
        fs.makeTree(dir_name);
    var file_name = dir_name + "/" + id + ".orig";
    fs.write(file_name, stream.read());

    fields.original_file = file_name;

    // Convert file to HTML and read the result if possible:
    switch (content_type) {
        case "application/msword":
            // Convert DOC to HTML:
            var proc = java.lang.Runtime.getRuntime().exec(["abiword", "--to", "html", file_name]);
            proc.waitFor();

            // Set html field:
            var html_file_name = dir_name + "/" + id + ".html";
            fields.html = fs.read(html_file_name);
            fields.converted_by = "abiword";

            // Remove converted HTML to save disk space:
            //fs.remove(html_file_name);
            loadObject("Events").create("PolicyFeed/Source:setFieldsFromStream-debug", ["html_file_name", html_file_name]);
            break;

        default:
            fields.html = "";
    }

    return fields;

}


/**
 *
 */
exports.updateDoc = function(original, page) {
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
