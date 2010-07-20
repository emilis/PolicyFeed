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

var htmlunit = require("htmlunit");

exports.filter = function(page) {
    if (typeof(page) == "string" || !page.asXml) {
        page = htmlunit.getPageFromHtml(page, "http://example.org/", "default", "UTF-8")
    }

    var header = page.getElementById("header");
    if (header)
        header.remove();

    var nodes = page.getByXPath("//colgroup").toArray();
    if (nodes.length)
        nodes.map(function (item) { item.remove() });

    var nodes = page.getByXPath("//table").toArray();
    if (nodes.length) {
        nodes.map(function (item) {
                // move this to a separate function?:
                if (item.hasAttribute("cellpadding"))
                    item.removeAttribute("cellpadding");
                item.setAttribute("border", "1");
            });
    }

    var nodes = page.getByXPath("//p").toArray();
    if (nodes.length) {
        nodes.map(function (item) {
                if (item.hasAttribute("awml:style"))
                    item.removeAttribute("awml:style");
            });
    }
    
    return page.getBody().asXml().replace(/%26/g, "&");
}

