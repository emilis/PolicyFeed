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
var search_params = "&search=0&metai=1990&metai2=2099";
exports.feed_url = [
    "http://www.lrski.lt/index_neig.php?p=0&l=LT&n=62" + search_params,
    "http://www.lrski.lt/index_neig.php?p=0&l=LT&n=62" + search_params + "&praleisti=30"
];

exports.doc_template = {
    type: "nutarimas",
    org: "LRS/KĮ",
    organization: "Lietuvos Respublikos Seimo kontrolierių įstaiga",
};


// --- Custom methods: ---

/**
 *
 */
exports.extractFeedItems = function(page)
{
    htmlunit.fixPageUrls(page);

    var rows = page.getByXPath('//body/table/tbody/tr').toArray().slice(2, -2);

    if (rows.length != 30) {
        return this.error("Incorrect number of links in feed.");
    } else {
        return rows.map(this.parseFeedItem());
    }
}


/**
 *
 */
exports.parseFeedItem = function() {
    var template = objects.clone(this.doc_template, { parser: this.name });

    return function(row) {
        
        var published = dates.fromISOString(row.getFirstByXPath("./td[2]").asText().trim());
        var now = new Date();
        if (published > now) {
            published = now;
        }
        if (published.getDate() != now.getDate()) {
            published.setHours(12);
        }

        var url = row.getFirstByXPath("./td[3]/a")
            .getAttribute("href").toString()
            .replace(search_params, "")
            .replace("&praleisti=30", "");

        return objects.clone(template, {
                teises_aktas: {
                    rusis: "pažyma",
                    numeris: row.getFirstByXPath("./td[1]").asText().trim(),
                    autorius: row.getFirstByXPath("./td[4]").asText().trim()
                },
                title: row.getFirstByXPath("./td[3]").asText().trim(),
                url: url,
                published: published
        });
    }
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

    var h3s = page.getByXPath("//body/h3");
    h3s.get(0).remove();

    var h5s = page.getByXPath("//body/h5");
    h5s.get(0).remove();
    h5s.get(1).remove();
    h5s.get(2).remove();
    h5s.get(3).remove();

    var divs = page.getByXPath("//body/div");
    var size = divs.size();
    divs.get(size - 1).remove();
    divs.get(size - 2).remove();

    var links = page.getByXPath("//body/a");
    var size = links.size();
    links.get(size - 1).remove();

    doc.html = page.body;

    return doc;
}



