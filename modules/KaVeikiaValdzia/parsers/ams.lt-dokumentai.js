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


// Requirements:
var ctl_dates = require("ctl/utils/dates");
var gluestick = require("gluestick");
var htmlunit = require("htmlunit");
var Queue = require("PolicyFeed/Crawler/Queue");
var organizations = require("KaVeikiaValdzia/tags/organizations");
var parser_utils = require("./utils");
var ringo_dates = require("ringo/utils/dates");

// Extends:
gluestick.extendModule(exports, "PolicyFeed/Crawler/Parser");

// Config:
exports.feed_url = [
    "http://www.ams.lt/va/Default.aspx?Id=2"
    ];

exports.domains = {
    "www.ams.lt":       3000,
    "www.ams.lt:8080":  3000,
};

exports.retry_limit = 480; // 8 hours

exports.doc_template = {
};


/**
 *
 */
exports.extractFeedItems = function(page) {
    this.validateFeedPage(page);
    htmlunit.fixPageUrls(page);

    var items = page.getByXPath('/html/body/form/table/tbody/tr[2]/td/table/tbody/tr/td/table').toArray();

    items.shift();
    if (items.length < 1) {
        return [];
    } else {
        return items.map(this.parseFeedItem()).filter(function(item) { return item });
    }
}


/**
 *
 */
exports.parseFeedItem = function() {
    var parser_name = this.name;
    var orgmap = organizations.getOrgMap();

    return function(table) {
        var item = {
            parser: parser_name,
            teises_aktas: {}
        };

        var link = table.getFirstByXPath('./tbody/tr/td[2]/a');

        item.title = link.asText();
        item.url = link.getHrefAttribute().toString();

        var desc = table.getFirstByXPath('./tbody/tr[2]/td/table/tbody/tr/td');

        var numeris = desc.getFirstByXPath("./span");
        if (numeris.asText()[0] != "_") {
            item.teises_aktas.numeris = numeris.asText();
        }
        numeris.remove();

        desc = desc.asText().split("\n");
        desc[1] = desc[1].split(", ");

        item.org = desc[1][0];
        item.type = desc[1][1];
        item.teises_aktas.tipas = item.type;
        item.teises_aktas.statusas = desc[2];

        var today = ctl_dates.formatFromString(new Date(), "yyyy-MM-dd");
        if (today > desc[0]) {
            item.published = ctl_dates.fromISOString(desc[0] + "T12:00:00");
        } else {
            item.published = new Date();
        }

        switch (item.org) {
            case "ALYTAUS MIESTO SAVIVALDYBĖS ADMINISTRACIJOS DIREKTORIUS":
                var org = orgmap["Alytaus s.adm."];
            break;
            case "ALYTAUS MIESTO SAVIVALDYBĖS MERAS":
            case "ALYTAUS MIESTO SAVIVALDYBĖS TARYBA":
            case "ALYTAUS MIESTO SAVIVALDYBĖS VALDYBA":
                var org = orgmap["Alytaus sav."];
            break;
            default:
                return false;
        }
        item.org = org.org;
        item.organization = org.organization;
        item.orgroups = org.region.split(",");


        switch (item.type) {
            case "Įsakymas":
            case "Potvarkis":
            case "Sprendimas":
                item.type = "nutarimas";
            break;
            case "Projektas":
                item.type = "projektas";
            break;
            case "Kreipimasis":
            case "Priedas":
            case "Protokolas":
                item.type = "kita";
            break;
            default:
                return false;
        }

        return item;
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

    var content = page.getElementById('ctl03_DocumentHtml');
    doc.html = content.asXml().replace('<td id="ctl03_DocumentHtml">', "").slice(0, -5);
    doc.text = content.asText();

    return doc;
}


