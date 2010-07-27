/*
    Copyright 2010 Emilis Dambauskas

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

var update_url = "http://localhost:8081/solr/update";
var search_url = 'http://localhost:8081/solr/select/?start=0&rows=100&sort=published+desc&fl=id,published,type,org,organization,title&wt=json&q=';


var httpclient = require("ringo/httpclient");
var jstorage = require("ctl/JsonStorage");

/**
 *
 */
var prepareDate = function(str) {
    if (!str.match(/^\d\d\d\d-\d\d-\d\d.\d\d:\d\d:\d\d/))
        throw Error("Unsupported date format: " + str);

    var d = new Date();
    d.setFullYear(str.substr(0,4));
    d.setMonth(parseInt(str.substr(5,2), 10) - 1);
    d.setDate(str.substr(8,2));
    d.setHours(str.substr(11,2));
    d.setMinutes(str.substr(14,2));
    d.setSeconds(str.substr(17,2));

    return d.toISOString();
}


/**
 *
 */
var stripTags = function(str) {
    return str.replace(/<[^>]*>/g, " ").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&\w+;/g, " ").trim();
}


/**
 *
 */
exports.itemToXml = function(item) {
    return '<doc>' 
        + '<field name="id">' + item._id + '</field>'
        + '<field name="published">' + prepareDate(item.published) + '</field>'
        + '<field name="type">' + item.type + '</field>'
        + '<field name="org">' + item.org + '</field>'
        + '<field name="organization">' + item.organization + '</field>'
        + '<field name="title">' + stripTags(item.title) + '</field>'
        + '<field name="html">' + stripTags(item.html) + '</field>'
        + '</doc>';
}


/**
 *
 */
exports.indexItem = function(item) {
    print("SolrClient.indexItem", item._id);
    try {
        var req = {
            method: "POST",
            url: update_url,
            contentType: "text/xml; charset=utf-8",
            data: '<add>' + this.itemToXml(item) + "</add>",
            error: function(e) { print(e, e.stack); throw e; }
            };
    } catch (e) {
        throw Error("Failed to create request for item " + item._id + ". Error: " + e.message);   
    }

    return httpclient.request(req);
}


/**
 *
 */
exports.removeItem = function(id) {
    var req = {
        method: "POST",
        url: update_url,
        contentType: "text/xml; charset=utf-8",
        data: '<delete><id>' + id + '</id></delete>'
    };

    return httpclient.request(req);
}


/**
 *
 */
exports.reindex = function(path) {
    if (path === undefined)
        path = "/docs";

    var gen = jstorage.iterate(path);

    for each (var doc in gen) {
        try {
            var e = this.indexItem(doc);
            if (e.content != '<result status="0"></result>')
                print(doc._id, e.content);
        } catch (e) {
            print(e.message);
        }
    }
}


/**
 *
 */
exports.onItemChange = function(action, _id, item) {
    print("SolrClient.onItemChange", action, _id);
    if (_id.indexOf("/docs/") > -1) {
        try {
            switch (action) {
                case "after-write":
                    return exports.indexItem(item);
                break;
                case "after-remove":
                    return exports.removeItem(_id);
                break;
            }
        } catch(e) {
            print(e, e.stack);
        }
    }
}


/**
 *
 */
exports.search = function(query, options) {
    print(query);
    query = query.replace(/\s+/g, "+");

    options = options || {};
    var {highlight, fields, limit} = options;

    var url = search_url;
    if (fields && fields.length)
        var url = url.replace(/fl=[^&]+/, "fl=" + fields.join(","));
    if (limit)
        var url = url.replace(/rows=[^&]+/, "rows=" + limit);
    if (highlight)
        url = url.replace("&q=", "&hl=true&hl.fl=html&q=");;

    var res = httpclient.get(url + query);
    if (res.status === 200)
        return JSON.parse(res.content);
}


/**
 *
 */
exports.searchByDay = function(day) {
    var query = "published:[" + day + "T00:00:00Z+TO+" + day + "T23:59:59.999Z]";
    return this.search(query);
}


/**
 *
 */
exports.searchByMonth = function(month) {
    var query = "published:[" + month + "-01T00:00:00Z+TO+" + month + "-01T00:00:00Z%2B1MONTH]";
    return this.search(query);
}


/**
 *
 */
exports.searchByYear = function(year) {
    var query = "published:[" + year + "-01-01T00:00:00Z+TO+" + year + "-12-31T23:59:59.999Z]";
    return this.search(query);
}


/**
 *
 */
exports.getLatestDocs = function (options) {
    return this.search("*:*", options).response;
}
