/*
    Copyright 2009,2010 Emilis Dambauskas

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
var htmlunit = require("htmlunit");

// --- Extend PolicyFeed/Parser : ---
exports.extendObject("PolicyFeed/Parser");


// --- Parser config: ---
exports.feed_url = "http://www.lrv.lt/rss/rss.php?cats=1-9-3-2-7-6-8-10-11-12-13-14-15-16-17-18-19-20-21-22-23&lang=lt";

exports.doc_template = {
    type: "pranesimas",
    org: "Vyriausybė",
    organization: "Lietuvos Respublikos Vyriausybė"
};


// --- Custom methods: ---

/**
 *
 */
exports.extractPageData = function(original, page) {
    // create doc from original:
    var doc = original;
    doc._id = doc._id.replace("originals", "docs");

    // Warning: No updates to original after this point or you'll regret it.

    htmlunit.fixPageUrls(page);

    // title:
    if (!doc.title)
        doc.title = page.getFirstByXPath('//div[@class="title"]/dl/dt').asText();

    // html:
    var news_div = page.getFirstByXPath('//div[@class="news-view"]');

    var extra_div = false;
    if (extra_div = news_div.getFirstByXPath('./div[@class="title"]'))
        extra_div.remove();
    if (extra_div = page.getElementById("sharesb"))
        extra_div.remove();
    if ((extra_div = news_div.getLastChild()) && extra_div.getTagName && (extra_div.getTagName() == "div"))
        extra_div.remove();


    // remove "back" links:
    var anchors = news_div.getElementsByTagName("a").toArray();
    for each (var a in anchors) {
        if (a.getAttribute("href").indexOf("history.back()") && a.asText() == "Atgal") {
            a.remove();
        }
    }

    doc.html = news_div;

    return doc;
}
