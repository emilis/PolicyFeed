/*
    Copyright 2009,2010 Emilis Dambauskas

    This file is part of Cheap Tricks Library for RingoJS.

    Cheap Tricks Library is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Cheap Tricks Library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Cheap Tricks Library.  If not, see <http://www.gnu.org/licenses/>.
*/

// Requirements:
var config = require("config");
var httpclient = require("ringo/httpclient");

var log = require("ringo/logging").getLogger(module.id);

/**
 *
 */
exports.connect = function(module_id) {
    var cfg = config[module_id] || {
        url: "http://localhost:8080/solr"
    };

    this.update_url = cfg.url + "/update";
    this.search_url = cfg.url + "/select/";
}


/**
 *
 * @param {String|Number} id Document ID.
 */
exports.read = function(filter) {
    return this.list({id: filter}, {limit: 1})[0];
}


/**
 *
 */
exports.write = function(id, data) {
    log.debug("write", id);

    if (this.serialize) {
        data = this.serialize(data);
    }

    var xml = '<doc>';

    for (var k in data) {
        if (data[k] instanceof Date) {
            xml += '<field name="' + k + '">' + data[k].toISOString() + '</field>';
        } else if (data[k] instanceof Array) {
            xml += '<field name="' + k + '">' + data[k].join('</field><field name="' + k + '">') + '</field>';
        } else {
            xml += '<field name="' + k + '">' + data[k] + '</field>';
        }
    }

    xml += '</doc>';

    var req = {
        method: "POST",
        url: this.update_url,
        contentType: "text/xml; charset=utf-8",
        data: '<add>' + xml + "</add>",
        error: function(e) { log.error("write", id, e, e.stack); throw e; }
        };

    return httpclient.request(req);
}


/**
 *
 * @param {String|Arrary} id ID or array of IDs of documents to remove.
 */
exports.remove = function(id) {

    // Get a list of ids:
    if (typeof(id) == "string" || id instanceof String) {
        id = [id];
    }

    if (id.length) {
        var req = {
            method: "POST",
            url: this.update_url,
            contentType: "text/xml; charset=utf-8",
            data: '<delete><id>' + id.join("</id><id>") + '</id></delete>'
        };

        return httpclient.request(req);
    } else {
        return true;
    }
}


/**
 *
 */
exports.list = function(query, options) {
    var options = options || {};

    var params = {};
    params.wt = options.format || "json";
    params.rows = options.limit || 100;
    params.start = options.offset || 0;

    if (options.fields) {
        params.fl = options.fields.join(",");
    }
    if (options.highlight) {
        params.hl = "true";
        params["hl.fl"] = options.highlight.join(",");
    }

    if (options.order) {
        params.sort = "";
        var sep = "";
        for (var k in options.order) {
            if (options.order[k] == -1) {
                params.sort += sep + encodeURIComponent(k) + "+desc";
            } else if (options.order[k] == 1) {
                params.sort += sep + encodeURIComponent(k) + "+asc";
            }
            sep = ",";
        }
    }

    params.q = "";
    if (typeof(query) == "string" || query instanceof String) {
        params.q = encodeURIComponent(query);
    } else {
        var sep = "";
        for (var k in query) {
            var value = query[k];
            var enk = encodeURIComponent(k) + ":";

            if (value instanceof Date) {
                params.q += sep + enk + value.toISOString();
            } else if (typeof(value) == "string" || value instanceof String) {
                params.q += sep + enk + encodeURIComponent(value);
            } else if (value instanceof Array) {
                params.q += sep + "(" + enk + value.join(" OR " + enk) + ")";
            } else if (value.action == "range") {
                params.q += sep + enk + "[" + encodeURIComponent(value.from) + " TO " + encodeURIComponent(value.to) + "]";
            } else {
                throw Error("Unrecognized parameter '" + k + "' value '" + value + "'.");
            }

            sep = " AND ";
        }
    }

    var url = this.search_url;
    url += "?" + Object.keys(params).map(function(k) { return k + "=" + params[k]; }).join("&");

    var res = httpclient.get(url);
    if (res.status !== 200) {
        throw Error(module.id + ".list(): Solr server returned an error. Url: " + url);
    } else {
        if (options.format) {
            return res.content;
        } else {
            var content = JSON.parse(res.content);
            if (content && content.response && content.response.docs && content.response.docs.length) {
                var r = content.response;
                var h = content.highlighting;

                content = this.unserialize ? r.docs.map(this.unserialize) : r.docs;
                if (h) {
                    content = content.map(function(doc) { doc._highlight = h[doc.id]; return doc; });
                }

                // This should be added after all map() calls:
                Object.defineProperty(content, "numFound", {enumerable:false, value: r.numFound });

                return content;
            } else {
                return [];
            }
        }
    }
}

