/*
    Copyright 2011 Emilis Dambauskas

    This file is part of KaVeikiaValdzia.lt website.

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


// --- Requirements: ---
var dates = require("ctl/utils/dates");
var htmlunit = require("htmlunit");
var gluestick = require("gluestick");
var objects = require("ringo/utils/objects");

// --- Extend PolicyFeed/Crawler/Parser : ---
gluestick.extendModule(exports, "PolicyFeed/Crawler/Parser");


// --- Parser config: ---
exports.feed_url = ["http://www.lrski.lt/index_neig.php?p=0&l=LT&n=46"];

exports.doc_template = {
    type: "pranesimas",
    org: "LRS/KĮ",
    organization: "Lietuvos Respublikos Seimo kontrolierių įstaiga"
};


// --- Custom methods: ---

/**
 *
 */
exports.extractFeedItems = function(page)
{
    var divs = page.getByXPath('//body/div');
    var items = [];

    var current_item = false;
    
    // var div = false;
    // while (div = divs.shift()) {
    for (var i=0,size=divs.size(); i<size; i++) {
        var div = divs.get(i);

        switch (div.getAttribute("class")) {

            case "naudata":
                current_item && items.push(current_item);
                current_item = objects.clone(this.doc_template, {
                        parser: this.name,
                        published: dates.fromISOString(div.asText().replace(" | ", "T"))
                });
                break;

            case "nauantraste":
                current_item.title = div.asText();
                current_item.url = page.getFullyQualifiedUrl(
                    div.getFirstByXPath("./a").getHrefAttribute()
                ).toString();
                break;

            case "nauturinys":
                current_item.summary = div.asText();
                break;

            default:
                // do nothing
        }
    }

    current_item && items.push(current_item);

    if (items.length < 1)
        return this.error("extractFeedItems", "No items found in feed.");
    else
        return items;
}


/**
 *
 */
exports.extractPageData = function(original, page) {
    // create doc from original:
    var doc = original;
    doc._id = doc._id.replace("originals", "docs");

    // Warning: No updates to original after this point or you'll regret it.

    htmlunit.fixPageUrls(page);

    doc.html = page.getFirstByXPath('//div[@class="nauturinys"]');

    return doc;
}
