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
var Queue = require("PolicyFeed/Crawler/Queue");

// Extends:
gluestick.extendModule(exports, "PolicyFeed/Crawler/Parser");

// Config:
exports.feed_url = "http://www3.lrs.lt/pls/inter/lrs_rss.teises_aktai";

exports.domains = {
    "www.lrs.lt": 3000,
    "www3.lrs.lt": 3000
};

exports.doc_template = {
    type: "projektas",
    org: "Seimas",
    organization: "Lietuvos Respublikos Seimas"
};


/**
 *
 */
exports.extractFeedItems = function(page) {
    this.validateFeedPage(page);

    var items = page.getByXPath("/rss/channel/item").toArray();
    if (items.length < 1) {
        return [];
    } else {
        return items.map(this.parseFeedItem());
    }
}


/**
 *
 */
exports.parseFeedItem = function(item) {
    var name = this.name;
    var doc_template = this.doc_template;
    var error = this.error;

    return function(item) {
        // Tries to get a correct url:
        var link_url = item.getFirstByXPath("link").asText();
        var guid_url = item.getFirstByXPath('guid[@isPermaLink="true"]').asText();
        var desc_url = item.getFirstByXPath("description").asText();

        var test = "lrs.lt/pls/inter/dokpaieska.showdoc_l";
        if (link_url.indexOf(test) > 0)
            var url = link_url;
        else if (guid_url.indexOf(test) > 0)
            var url = guid_url;
        else if (desc_url.indexOf(test) > 0)
        {
            // Get start of url position:
            var url = desc_url.indexOf(test);
            // Cut out the url until a double-quote:
            url = "http://www." + desc_url.substr(url, desc_url.indexOf('"', url) - url);
        }
        else
        {
            // Fail at this point:
            throw error("parseFeedItem", "Failed to get any url from:" + link_url + " " +  guid_url + " " + desc_url);
        }

        // Fix 00:00 time for "published" field:
        var published = item.getFirstByXPath("pubDate").asText();
        published = published.replace(/\./g, "-").replace(/ 00:00/, ringo_dates.format(new Date(), " HH:mm:ss"));

        // Result object:
        var result =  {
            url:        url,
            title:      item.getFirstByXPath("title").asText(),
            published:  published,
            summary:    item.getFirstByXPath("description").asText(),
            parser:     name
            };

        for (var key in doc_template)
            result[key] = doc_template[key];

        return result;
    }
}


/**
 *
 */
exports.extractPageData = function(original, page) {
    // create doc from original:
    var doc = original;
    var original_id = original._id;
    doc._id = doc._id.replace("originals", "docs");

    // Warning: No updates to original after this point or you'll regret it.
    if (doc.converted_by)
        return doc;

    htmlunit.fixPageUrls(page);

    // --- get title: ---
    doc.title = page.getFirstByXPath('//caption[@class="pav"]').asText();
    if (!doc.title)
        delete doc.title;

    // --- get meta: ---
    var info_table = page.getFirstByXPath('/html/body/table[@class="basic"]/tbody');
    var info = {
        rusis:          info_table.getFirstByXPath('./tr[1]/td[1]').asText().replace("Rūšis:", "").trim(),
        numeris:        info_table.getFirstByXPath('./tr[1]/td[2]').asText().replace("Numeris:", "").trim(),
        data:           info_table.getFirstByXPath('./tr[1]/td[3]').asText().replace("Data:", "").trim(),
        kalba:          info_table.getFirstByXPath('./tr[1]/td[4]').asText().replace("Kalba:", "").trim(),
        publikavimas:   info_table.getFirstByXPath('./tr[2]/td[1]').asText().replace("Publikavimas:", "").trim(),
        statusas:       info_table.getFirstByXPath('./tr[2]/td[2]').asText().replace("Statusas:", "").trim(),
        eurovoc:        info_table.getFirstByXPath('./tr[5]/td').asText().replace("Eurovoc 4.2 terminai:", "").trim(),
        pateike:        info_table.getFirstByXPath('./tr[3]/td').asText(),
        //susije:         info_table.getFirstByXPath('./tr[4]/td/table/tbody/tr/td[1]'),
        //word:           info_table.getFirstByXPath('./tr[4]/td/table/tbody/tr/td[2]')
    };

    var pateike_link = info_table.getFirstByXPath('./tr[3]/td/a');
    if (pateike_link)
        info.pateike_link = pateike_link.getHrefAttribute();

    var susije_link = info_table.getFirstByXPath('./tr[4]/td/table/tbody/tr/td[1]/a');
    if (susije_link)
        info.susije = susije_link.getHrefAttribute();

    var word_link = info_table.getFirstByXPath('./tr[4]/td/table/tbody/tr/td[2]/a');
    if (word_link)
        info.word = word_link.getHrefAttribute();



    doc.teises_aktas = info;


    // --- get html: ---
    doc.html = page.asXml();
    var hr_html = '<hr style="color:#666666"/>';
    var first_hr = doc.html.indexOf(hr_html);
    var last_hr = doc.html.lastIndexOf(hr_html);

    if (first_hr < 0 || last_hr < 0 || last_hr <= first_hr)
        throw this.error("extractPageData", "HRs not found");

    doc.html = doc.html.slice(
            first_hr + hr_html.length,
            last_hr);

    // Schedule "nėra teksto" docs for re-check after 5 minutes:
    if (doc.html.match(/nėra\steksto\sHTML\sformatu/i)) {
        Queue.scheduleUrl({
            url: doc.url,
            domain: "www.lrs.lt",
            parser: this.name,
            method: "parsePage",
            original_id: original_id
            }, new Date().getTime() + 5*60*1000);
    } else {
        doc.html = '<hml><body>' + doc.html + '</body></html>';
        var url = page.webResponse.requestUrl;
        var window_name = page.getEnclosingWindow().name;

        var page = htmlunit.getPageFromHtml(doc.html, url, window_name, "UTF-8");
        doc.html = page.getFirstByXPath("/html/body");
    }

    return doc;
}


/**
 *
 */
exports.parseNonHtml = function(original, page, url) {
    if (page.webResponse.contentType == "text/plain") {
        Queue.scheduleUrl(url, new Date(new Date().getTime() + 3*60*1000));
        throw Error(module.id + ".parseNonHtml: rescheduled page that is temporarily unavailable.");
    } else {
        throw Error(module.id + ".parseNonHtml: unknown page type.");
    }
}
