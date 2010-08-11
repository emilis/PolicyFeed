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
var ctlDate = require("ctl/Date");

// --- Extend PolicyFeed/Parser : ---
var Parser = require("PolicyFeed/Parser");
for (var key in Parser)
    exports[key] = Parser[key];


// --- Parser config: ---
exports.feed_url = [
    "http://www.president.lt/lt/prezidento_veikla/sveikinimai.html",
    "http://www.president.lt/lt/prezidento_veikla/uzuojautos.html",
    "http://www.president.lt/lt/prezidento_veikla/vizitai/uzsienyje.html",
    "http://www.president.lt/lt/prezidento_veikla/prezidente_ziniasklaidoje/interviu_385.html"
    ];

exports.doc_template = {
    type: "pranesimas",
    org: "Prezidentas",
    organization: "Lietuvos Respublikos Prezidentas"
};


// --- Custom methods: ---

/**
 *
 */
exports.extractFeedItems = function (page) {
    this.validateFeedPage(page);

    htmlunit.fixPageUrls(page);

    var content = page.getElementById("inner-container");

    var items = content.getByXPath('./div[@class="news_date_and_title"]').toArray();
    if (items.length < 1) {
        return [];
    } else {
        var name = this.name;
        var doc_template = this.doc_template;

        return items.map(function (item) {
            var published = item.getFirstByXPath('./span').asText().trim();
            var link = item.getFirstByXPath('./span[2]/a');

            var result = {
                url:        link.getHrefAttribute(),
                title:      link.asText().trim(),
                };

            // get published value:
            published = ctlDate.fromISOString(published);
            var d = new Date();

            if (published.format("HH:mm:ss") == "00:00:00") {
                if (published.format("yyyy-MM-dd") == d.format("yyyy-MM-dd")) {
                    published.setHours(d.getHours());
                    published.setMinutes(d.getMinutes());
                    published.setSeconds(d.getSeconds());
                    published.setMilliseconds(d.getMilliseconds());
                } else {
                    published.setHours(12);
                }
            }
            result.published = published;

            // get summary:
            var summary = item.getNextSibling();
            if (summary && summary.getTagName && summary.getTagName() == "div" && summary.asText().trim())
                result.summary = summary.asText().trim();

            // mandatory fields:
            result.parser = name;
            for (var k in doc_template)
                result[k] = doc_template[k];

            return result;
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

    var content = page.getElementById("inner-container");

    // Change title (removes dates from titles in RSS and other feeds for this website):
    var title = content.getFirstByXPath('./h4');
    if (title && title.asText && title.asText().trim())
        doc.title = title.asText().trim();
    title.remove();

    doc.html = content;

    return doc;
}
