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
var UrlQueue = require("PolicyFeed/UrlQueue");
var BrowserController = require("PolicyFeed/BrowserController");

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
        this.list[name].UrlQueue = UrlQueue;
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
    return this.list[url.source][url.method](url, page);
}
