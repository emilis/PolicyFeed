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

    // Turn string into date parts array:
    str = str.replace(/[-T:Z. ]/g, "-").split("-").map(function(item) { return parseInt(item, 10); });

    var d = new Date();
    d.setFullYear(str[0]);
    d.setDate(str[2]); // Date before month! Or you'll get march instead of february every 30th and 31th of the month.
    d.setMonth(str[1] - 1);
    d.setHours(str[3]);
    d.setMinutes(str[4]);
    d.setSeconds(str[5]);
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

    var text = item.text ? item.text : item.html;

    return '<doc>' 
        + '<field name="id">' + item._id + '</field>'
        + '<field name="published">' + prepareDate(item.published) + '</field>'
        + '<field name="type">' + item.type + '</field>'
        + '<field name="org">' + item.org + '</field>'
        + '<field name="organization">' + item.organization + '</field>'
        + '<field name="title">' + stripTags(item.title) + '</field>'
        + '<field name="html">' + stripTags(text) + '</field>'
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
    query = encodeURIComponent(query);

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


function getYmd(str) {
    var [year, month, day] = str.split("-");

    year = parseInt(year, 10);
    month = month ? (parseInt(month, 10) - 1) : 0;
    day = day ? parseInt(day, 10) : 1;
    
    return [year, month, day];
}


/**
 *
 */
exports.searchByDateRange = function(from, to, options) {
    from = new Date(from);
    to = new Date(to);

    return this.search( "published:[" + from.toISOString() + " TO " + to.toISOString() + "]" );
}

/**
 *
 */
exports.searchByDay = function(day) {
    var [year, month, day] = getYmd(day);
    var from = new Date(year, month, day, 0, 0, 0, 0);
    var to = new Date(year, month, day + 1, 0, 0, 0, -1);

    return this.searchByDateRange(from, to);
}


/**
 *
 */
exports.searchByMonth = function(month) {
    var [year, month, day] = getYmd(day);
    var from = new Date(year, month, day, 0, 0, 0, 0);
    var to = new Date(year, month + 1, day, 0, 0, 0, -1);

    return this.searchByDateRange(from, to);
}


/**
 *
 */
exports.searchByYear = function(year) {
    var [year, month, day] = getYmd(day);
    var from = new Date(year, month, day, 0, 0, 0, 0);
    var to = new Date(year + 1, month, day, 0, 0, 0, -1);

    return this.searchByDateRange(from, to);
}


/**
 *
 */
exports.getLatestDocs = function (options) {
    return this.search("*:*", options).response;
}
