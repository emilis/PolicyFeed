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
var gluestick = require("gluestick");
var htmlunit = require("htmlunit");
var ringo_dates = require("ringo/utils/dates");

// Extends:
gluestick.extendModule(exports, "PolicyFeed/Crawler/Parser");

// Config:
exports.feed_url = "http://www3.lrs.lt/pls/inter/w5_sale.ses_pos";

exports.domains = {
    "www.lrs.lt": 3000,
    "www3.lrs.lt": 3000
};

exports.doc_template = {
    type: "darbotvarke",
    org: "Seimas",
    organization: "Lietuvos Respublikos Seimas"
};

//------------------------------------------------------------------------

/**
 *
 */
exports.extractFeedItems = function(page) {
    this.validateFeedPage(page);

    var path = '/html/body/div/table/tbody/tr[3]/td/table/tbody/tr/td/align/a';

    var items = page.getByXPath(path).toArray();
    if (items.length < 1)
        return [];
    else {
        return items.map(function(item) {
                return {
                    url: item.getAttribute("href"),
                    title: item.asText(),
                    published: ringo_dates.format(new Date(), "yyyy-MM-dd HH:mm:ss"),
                    summary: ""
                };
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


    // --- get title: ---
    doc.title = page.getFirstByXPath('//caption[@class="pav"]').asText();
    if (!doc.title)
        delete doc.title;

    // --- get html: ---
    doc.html = page.asXml();
    var hr_html = '<hr style="color:#666666"/>';
    var first_hr = doc.html.indexOf(hr_html);
    var last_hr = doc.html.lastIndexOf(hr_html);

    if (first_hr < 0 || last_hr < 0 || last_hr <= first_hr)
        throw this.error("extractPageData", "HRs not found.");

    doc.html = doc.html.slice(
            first_hr + hr_html.length,
            last_hr);

    // return html as DomElement:
    doc.html = '<hml><body>' + doc.html + '</body></html>';
    var url = page.webResponse.requestUrl;
    var window_name = page.getEnclosingWindow().name;

    var page = htmlunit.getPageFromHtml(doc.html, url, window_name, "UTF-8");
    doc.html = page.getFirstByXPath("/html/body");


    return doc;
}





