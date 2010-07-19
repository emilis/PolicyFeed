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

var fs = require("fs");
var htmlunit = require("htmlunit");
var UrlQueue = require("PolicyFeed/UrlQueue");
var UrlList = require("PolicyFeed/UrlList");
var BrowserController = require("PolicyFeed/BrowserController");
var JsonStorage = require("ctl/JsonStorage");
var Sequence = require("ctl/SimpleSequence");


exports.list = {};


/**
 *
 */
exports.getSourceList = function(source_dir, source_prefix) {
    var list = {};

    var source_names = fs.list(source_dir);
    for each (var name in source_names) {
        if (name[0] != ".") {
            // remove ".js" extension:
            name = name.substr(0, name.length - 3);
            list[name] = require(source_prefix + name);
            if (list[name].disabled)
                delete list[name];
        }
    }

    return list;
}


/**
 *
 */
exports.getDomains = function() {
    var domains = {};

    for each (var source in this.list) {
        if (source.domains) {
            for (var domain in source.domains) {
                domains[domain] = { delay: source.domains[domain] };
            }
        } else {
            if (source.feed_url instanceof Array) {
                for each (var url in source.feed_url) {
                    domains[UrlQueue.getDomainFromUrl(url)] = {};
                }
            } else {
                domains[UrlQueue.getDomainFromUrl(source.feed_url)] = {};
            }
        }
    }

    return domains;
}

/**
 *
 */
exports.init = function(options) {
    options = options || {};
    var {source_dir, source_prefix} = options;

    this.list = this.getSourceList(source_dir, source_prefix);

    for (var name in this.list) {
        this.list[name].name = name;
        this.list[name].parent = this;
        //this.list[name].UrlQueue = UrlQueue;
    }

    UrlQueue.init({ domainList: this.getDomains() });

    BrowserController.init(this, UrlQueue);
    BrowserController.start();
}

/**
 *
 */
exports.checkUpdates = function() {
    for (var name in this.list) {
        var urls = this.list[name].feed_url;
        if (!(urls instanceof Array))
            urls = [urls];

        for each (var url in urls) {
            if (!UrlQueue.isUrlScheduled(url)) {
                UrlQueue.scheduleUrl({
                    url: url,
                    source: name,
                    method: "checkFeed"
                    }, 0);
            }
        }
    }
}


/**
 *
 */
exports.processUrl = function(url, page) {
    switch (url.method) {
        case "checkFeed":
            return this.checkFeed(url.source, url, page);
        break;
        case "parsePage":
            return this.parsePage(url.source, url, page);
        break;
        default:
            return this.list[url.source][url.method](url, page);
    }
}


/**
 *
 */
exports.checkFeed = function(source_name, url, page) {

    var urls = this.list[source_name].extractFeedItems(page);

    // Remove existing urls:
    urls = urls.filter(function (item) {
        if (UrlList.exists(item.url))
            return false;
        else
            return true;
        });

    // Save url to originals, add to UrlList and UrlQueue:
    urls.map(function (item) {
        // create originals:
        var id = "/originals/" + item.published.substr(0, 10).replace(/-/g, "/") + "/";
        id += Sequence.next();

        print("adding page:", id, item.published, item.url, item.title);

        JsonStorage.write(id, item);
        UrlList.addUrl(item.url, id);

        UrlQueue.addUrl({
            url: item.url,
            source: source_name,
            method: "parsePage",
            original_id: id
            });
    });

    // schedule next check:
    UrlQueue.scheduleUrl(url, new Date(new Date().getTime() + 5*60*1000));
}


/**
 *
 */
exports.parsePage = function(source_name, url, page) {
    var source = this.list[source_name];

    if (source.parsePage) {
        return source.parsePage(url, page);
    } else {
        var original = this.saveOriginal(source_name, url, page);
        var doc = source.extractPageData(original, page);
        JsonStorage.write(doc._id, doc);
    }
}


/**
 *
 */
exports.saveOriginal = function(source_name, url, page) {
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
            loadObject("Events").create("PolicyFeed/SourceList:setFieldsFromStream-debug", ["html_file_name", html_file_name]);
            break;

        default:
            fields.html = "";
    }

    return fields;

}

