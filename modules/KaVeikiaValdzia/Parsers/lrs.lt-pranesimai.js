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

// Requirements:
var htmlunit = require("htmlunit");

// Extends:
exports.extendObject("PolicyFeed/Parser");

// Config:

exports.feed_url = "http://www3.lrs.lt/pls/inter/lrs_rss.pranesimai_spaudai";

exports.domains = {
    "www.lrs.lt": 3000,
    "www3.lrs.lt": 3000
};

exports.doc_template = {
    type: "pranesimas",
    org: "Seimas",
    organization: "Lietuvos Respublikos Seimas"
};


/**
 *
 */
exports.extractFeedItems = function (page) {
    this.validateFeedPage(page);

    var items = page.getByXPath("/rss/channel/item").toArray();
    if (items.length < 1) {
        return [];
    } else {
        var name = this.name;
        var doc_template = this.doc_template;

        return items.map(function (item) {
            var result = {
                url:        item.getFirstByXPath("link").asText(),
                title:      item.getFirstByXPath("title").asText(),
                published:  item.getFirstByXPath("pubDate").asText(),
                summary:    item.getFirstByXPath("description").asText()
                };

            result.published = result.published.replace(/\./g, "-") + ":00";

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
    if (doc.converted_by)
        return doc;

    htmlunit.fixPageUrls(page);

    // title:
    if (!doc.title) {
        doc.title = page.getFirstByXPath("/html/head/title");
        if (doc.title)
            doc.title = doc.title.asText();
        else
            delete doc.title;
    }

    // html:
    var content = page.getElementById("divDesContent");

    var html = content.getFirstByXPath('./div/table/tbody/tr/td/div[2]');
    if (html)
        html.removeAttribute("align");
    else
        html = content.getFirstByXPath('./div/table/tbody/tr/td');

    doc.html = html.asXml();

    return doc;
}


