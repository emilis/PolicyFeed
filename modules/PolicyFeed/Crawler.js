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

var DomElement = com.gargoylesoftware.htmlunit.html.DomElement;

var config = require("config");
var gluestick = require("gluestick");
var fs = require("fs");
var htmlunit = require("htmlunit");
var ctlDate = require("ctl/Date");
var Events = gluestick.loadModule("Events");

var UrlQueue = require("PolicyFeed/UrlQueue");
var UrlList = require("PolicyFeed/UrlList");
var BrowserController = require("PolicyFeed/BrowserController");
var JsonStorage = require("ctl/JsonStorage");
var Sequence = require("ctl/SimpleSequence");

var filters = {
    "default": require("PolicyFeed/filters/default"),
    abiword: require("PolicyFeed/filters/abiword"),
};



exports.parsers = {};


/**
 *
 */
exports.getParserList = function(parser_dir, parser_prefix) {
    var list = {};

    var parser_names = fs.list(parser_dir);
    for each (var name in parser_names) {
        if (name[0] != ".") {
            // remove ".js" extension:
            name = name.substr(0, name.length - 3);
            list[name] = require(parser_prefix + name);
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

    for each (var parser in this.parsers) {
        if (parser.domains) {
            for (var domain in parser.domains) {
                domains[domain] = { delay: parser.domains[domain] };
            }
        } else {
            if (parser.feed_url instanceof Array) {
                for each (var url in parser.feed_url) {
                    domains[UrlQueue.getDomainFromUrl(url)] = {};
                }
            } else {
                domains[UrlQueue.getDomainFromUrl(parser.feed_url)] = {};
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
    var {parser_dir, parser_prefix} = options;

    this.parsers = this.getParserList(parser_dir, parser_prefix);

    for (var name in this.parsers) {
        this.parsers[name].name = name;
        this.parsers[name].Crawler = this;
    }

    UrlQueue.init({ domainList: this.getDomains() });

    BrowserController.init(this, UrlQueue);
    BrowserController.start();
}

/**
 *
 */
exports.checkUpdates = function() {
    for (var name in this.parsers) {
        var urls = this.parsers[name].feed_url;
        if (!(urls instanceof Array))
            urls = [urls];

        for each (var url in urls) {
            if (!UrlQueue.isUrlScheduled(url)) {
                UrlQueue.scheduleUrl({
                    url: url,
                    parser: name,
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
            return this.checkFeed(url.parser, url, page);
        break;
        case "parsePage":
            return this.parsePage(url.parser, url, page);
        break;
        default:
            return this.parsers[url.parser][url.method](url, page);
    }
}


/**
 *
 */
exports.checkFeed = function(parser_name, url, page) {

    var urls = this.parsers[parser_name].extractFeedItems(page);

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
        var id = "/originals/" + ctlDate.formatFromString(item.published, "yyyy/MM/dd/");
        id += Sequence.next();

        print("adding page:", id, item.published, item.url, item.title);

        JsonStorage.write(id, item);
        UrlList.addUrl(item.url, id);

        UrlQueue.addUrl({
            url: item.url,
            parser: parser_name,
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
exports.parsePage = function(parser_name, url, page) {
    var parser = this.parsers[parser_name];

    if (parser.parsePage) {
        return parser.parsePage(url, page);
    } else {
        var original = this.saveOriginal(parser_name, url, page);
        var doc = parser.extractPageData(original, page);

        // run default filters on doc html:
        if (doc.html instanceof DomElement) {
            doc.text = doc.html.asText();
            doc.html = filters["default"].filterXml(doc.html).asXml();
        }

        doc.html = filters["default"].filter(doc.html);

        // run abiword filters:
        if (doc.converted_by == "abiword") {
            var window_name = page.getEnclosingWindow().name;
            doc.html = filters["abiword"].filter(
                doc,
                htmlunit.getPageFromHtml(doc.html, url.url, window_name, "UTF-8")
                );
        }

        JsonStorage.write(doc._id, doc);
    }
}


/**
 *
 */
exports.reindexDoc = function(doc_id) {
    var doc = JsonStorage.read(doc_id);

    var url = { url: doc.url, parser: doc.parser };
    url.method = "parsePage";
    url.original_id = doc._id.replace("docs", "originals");

    return UrlQueue.addUrl(url);
}


/**
 *
 */
exports.reindexUrl = function(url) {
    return this.reindexDoc( UrlList.getDocId(url) );
}


/**
 *
 */
exports.saveOriginal = function(parser_name, url, page) {
    var original = JsonStorage.read(url.original_id);

    var response = page.getWebResponse();
    original.content_type = response.getContentType();

    // DOC files, etc.:
    if (page instanceof com.gargoylesoftware.htmlunit.UnexpectedPage) {
        original.original_file = this.saveOriginalFile(original._id, url.url, response);
        if (original.content_type == "application/msword") {
            var fields = this.getFieldsFromDoc(original.original_file);
            for (var key in fields)
                original[key] = fields[key];
        } else {
            throw Error(module.id + ".saveOriginal: Unsupported page type.", url.original_id + " | " + url.url);
        }
    } else if (page instanceof com.gargoylesoftware.htmlunit.SgmlPage) {
        // Sgml page is parent class for HtmlPage, XmlPage and XhtmlPage.
        htmlunit.setPageCharset(page, "UTF-8");
        original.html = page.asXml();
    }
    else
        throw Error(module.id + ".saveOriginal: Unsupported page type.", url.original_id + " | " + url.url);

    // save original:
    JsonStorage.write(original._id, original);

    return original;
}


/**
 *
 */
exports.saveOriginalFile = function(original_id, url, response) {
    var dir_name = config.DIRS.uploads + original_id.replace("/originals/", "/");
    var file_name = dir_name + "/"
        + url.split("/").pop().replace(/[^-._a-z0-9]/gi, "-");

    if (!fs.exists(dir_name))
        fs.makeTree(dir_name);

    var stream = new (require("io").Stream)(response.getContentAsStream());
    fs.write(file_name, stream.read());

    return file_name;
}


/**
 *
 */
exports.getFieldsFromDoc = function(file_name) {
    var fields = {};

    // get file name with a changed extension:
    var html_file_name = fs.base(file_name).split(".");
    if (html_file_name.length > 1)
        html_file_name.pop();
    html_file_name = fs.directory(file_name) + "/" + html_file_name.join(".") + ".html";

    // Convert file to HTML and read the result if possible:
    var proc = java.lang.Runtime.getRuntime().exec(["abiword",
            "--to=html",
            file_name]);
    proc.waitFor();

    // Set html field:
    fields.html = fs.read(html_file_name);
    fields.converted_by = "abiword";

    // Remove converted HTML to save disk space:
    //fs.remove(html_file_name);
    Events.create("PolicyFeed/Crawler.getFieldsFromDoc-debug", ["html_file_name", html_file_name]);

    return fields;
}

