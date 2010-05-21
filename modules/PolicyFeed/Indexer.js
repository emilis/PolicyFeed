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

var url = "http://localhost:8081/solr/update";

import("ringo/httpclient", "httpclient");
import("ctl/JsonStorage", "jstorage");

/**
 *
 */
exports.itemToXml = function(item) {
    return '<doc>' 
        + '<field name="id">' + item.id + '</field>'
        + '<field name="published">' + item.published + '</field>'
        + '<field name="source">' + item.short_source + '</field>'
        + '<field name="title"><![CDATA[' + item.title + ']]></field>'
        + '<field name="html"><![CDATA[' + item.html + ']]></field>'
        + '</doc>';
}


/**
 *
 */
exports.indexItem = function(item) {
    var req = {
        method: "POST",
        url: url,
        contentType: "text/xml;charset=utf-8",
        data: '<add>' + this.itemToXml(item) + "</add>"
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
        this.indexItem(doc);
    }
}
