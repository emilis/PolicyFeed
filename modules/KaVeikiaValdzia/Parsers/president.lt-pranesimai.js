/*
    Copyright 2010 Emilis Dambauskas

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
var Parser = require("PolicyFeed/Parser");
for (var key in Parser)
    exports[key] = Parser[key];


// --- Parser config: ---
exports.feed_url = ["http://www.president.lt/lt/rss/rss.rss",
    "http://www.president.lt/lt/rss/rss_kalbos.rss"];

exports.doc_template = {
    type: "pranesimas",
    org: "Prezidentas",
    organization: "Lietuvos Respublikos Prezidentas"
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

    var content = page.getElementById("inner-container");

    // Change title (removes dates from titles in RSS and other feeds for this website):
    var title = content.getFirstByXPath('./h4');
    if (title && title.asText && title.asText().trim())
        doc.title = title.asText().trim();
    title.remove();

    doc.html = content;

    return doc;
}
