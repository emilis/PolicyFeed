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

var config = require("config");

var htmlunit = require("htmlunit");

exports.filter = function(doc, page) {
    if (typeof(page) == "string" || !page.asXml) {
        page = htmlunit.getPageFromHtml(page, "http://example.org/", "default", "UTF-8")
    }

    var header = page.getFirstByXPath('/body/div[@id="header"]');
    if (header)
        header.remove();

    var nodes = page.getElementsByTagName("colgroup").toArray();
    if (nodes.length)
        nodes.map(function (item) { item.remove() });

    var nodes = page.getElementsByTagName("table").toArray();
    if (nodes.length) {
        nodes.map(function (item) {
                // move this to a separate function?:
                if (item.hasAttribute("cellpadding"))
                    item.removeAttribute("cellpadding");
                item.setAttribute("border", "1");
            });
    }

    var nodes = page.getElementsByTagName("p").toArray();
    if (nodes.length) {
        nodes.map(function (item) {
                if (item.hasAttribute("awml:style"))
                    item.removeAttribute("awml:style");
            });
    }

    var nodes = page.getElementsByTagName("img").toArray();
    if (nodes.length) {
        nodes.map(function (item) {
                var src = item.getAttribute("src");
                if (src.match(".html_files/")) {
                    src = config.URLS.uploads + doc._id.replace("/docs", "") + "/" + src;
                    item.setAttribute("src", src);
                }
            });
    }
    
    return page.getBody().asXml().replace(/%26/g, "&").replace(/\u0096/g, "&mdash;");
}

