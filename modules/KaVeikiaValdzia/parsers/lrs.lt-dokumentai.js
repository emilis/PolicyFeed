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
var Failures = require("PolicyFeed/Crawler/Failures");
var gluestick = require("gluestick");
var htmlunit = require("htmlunit");
var Queue = require("PolicyFeed/Crawler/Queue");
var organizations = require("KaVeikiaValdzia/tags/organizations");
var ringo_dates = require("ringo/utils/dates");

// Extends:
gluestick.extendModule(exports, "PolicyFeed/Crawler/Parser");

// Config:
exports.feed_url = [
    "http://www3.lrs.lt/pls/inter3/dokpaieska.rezult_l",
    "http://www3.lrs.lt/pls/inter3/dokpaieska.rezult_l?p_nr=&p_nuo=&p_iki=&p_org=&p_drus=&p_kalb_id=&p_title=&p_text=&p_pub=&p_met=&p_lnr=&p_denr=&p_es=0&p_rus=1&p_tkid=&p_tid=&p_t=0&p_tr1=2&p_tr2=2&p_gal=&p_no=2"
    ];

exports.domains = {
    "www.lrs.lt": 3000,
    "www3.lrs.lt": 3000
};

exports.doc_template = {
};


/**
 *
 */
exports.extractFeedItems = function(page) {
    this.validateFeedPage(page);

    var items = page.getByXPath('/html/body/div/table/tbody/tr[3]/td/table/tbody/tr/td/align/table[2]/tbody/tr').toArray();

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
exports.parseFeedItem = function(item) {
    var name = this.name;
    var doc_template = this.doc_template;
    var error = this.error;
    var orgmap = organizations.getNameMap();

    return function(item) {

        var result = {};
        var teises_aktas = {};

        var num = item.getFirstByXPath('./td[1]').asText();
        var content = item.getFirstByXPath('./td[2]');
        var published = item.getFirstByXPath('./td[3]').asText();
        var numeris = item.getFirstByXPath('./td[4]').asText();
        if (numeris)
            teises_aktas.numeris = numeris;
        var type = item.getFirstByXPath('./td[5]').asText();

        // url and title:
        try {
            var tspan = content.getFirstByXPath('./span');
            var tlink = tspan.getFirstByXPath('./a');
            var title = tlink.asText();

            // get url without empty parameters:
            var url = tlink.getHrefAttribute().toString().split("?");
            url[1] = url[1].split("&").filter(function(param) { return (param.slice(-1) != "=") });
            url = url.join("?");

            tspan.remove();
        } catch(e) {
            if (num % 30 == 0) {
                // Link is always missing for item #30 (might be a HtmlUnit bug):
                return false;
            } else {
                throw e;
            }
        }

        // get non-empty content lines:
        content = content.asText().split(/[\n;]/).filter(function(part) { return part.trim(); });

        var author = "";
        for each (var line in content) {
            line = line.split(/[:,\/]/).map(function(part) { return part.trim() });

            switch (line[0]) {
                case "Pateikė":
                case "Priėmė":
                case "Parengė":
                    if (line[1].slice(0, 12) == "Seimo narys " || line[1].slice(0, 11) == "Seimo narė ") {
                        author = author || "Lietuvos Respublikos Seimas";
                    } else {
                        author = author || line[1];
                    }
                break;
                case "Seimo posėdis":
                    author = author || "Lietuvos Respublikos Seimas";
                break;
                case "Informaciniai pranešimai":
                    teises_aktas.informaciniai_pranesimai = line[1];
                break;
                case "Valstybės žinios":
                case "Valstybės Žinios":
                    teises_aktas.valstybes_zinios = line[1];
                break;
                // Don't forget to add a break statement to end your cases :-)
                default:

                    if (line[0].slice(0, 10) == "Įsigaliojo") {
                        teises_aktas.isigaliojo = line[0].slice(11);
                    } else if (line[0].slice(0, 18) == "Projektas priimtas") {
                        teises_aktas.priimtas = line[0].slice(20);
                    } else {
                        Failures.write(url, { parser: name, url: url, data: {
                                error: "Unrecognized line",
                                line: line
                            }});
                    }
            }
        }

        switch (type) {
            case "Darbotvarkė":
                type = "darbotvarke";
            break;

            case "Įstatymo projektas":
            case "Komiteto išvados projektas":
            case "Nutarimo projektas":
            case "Pasiūlymas":
            case "Rezoliucijos projektas":
            case "Statuto projektas":
                type = "projektas";
            break;

            case "Dekretas":
            case "Išvados":
            case "Komiteto išvada":
            case "Nutarimas":
            case "Pagrindinio komiteto išvada":
            case "Potvarkis":
            case "Sprendimas":
            case "Sutartis":
            case "Teisės departamento išvada":
                type = "nutarimas";
            break;

            case "Aiškinamasis raštas":
            case "Informacija":
            case "Informacinis pranešimas":
            case "Komiteto posėdžio protokolo išrašas":
            case "Lydraštis":
            case "Lyginamasis variantas":
            case "Priedas":
            case "Protokolas":
            case "Stenograma":
                type = "kita";
            break;

            default:
                Failures.write(url, { parser: name, url: url, data: {
                        error: "Unrecognized document type",
                        type: type
                        }});
                return false;
        }

        if (orgmap[author]) {
            var org = orgmap[author].org;
            var organization = orgmap[author].organization;
            var orgroups = orgmap[author].region.split(",");
        } else {
            Failures.write(url, { parser: name, url: url, data: {
                    error: "Unregognized author",
                    author: author
                    }});
            return false;
        }

        // Fix "published" field:
        var today = ringo_dates.format(new Date(), "yyyy-MM-dd");
        if (published >= today) {
            published = ringo_dates.format(new Date(), "yyyy-MM-dd HH:mm:ss");
        } else {
            published = published + " 12:00:00";
        }

        var result = {
            parser: name,
            type: type,
            org: org,
            organization: organization,
            orgroups: orgroups,
            url: url,
            title: title,
            published: published,
            teises_aktas: teises_aktas
        };

        return result;
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

    // --- get meta: ---
    var info_table = page.getFirstByXPath('/html/body/table[@class="basic"]/tbody');
    var info = {
        rusis:          info_table.getFirstByXPath('./tr[1]/td[1]').asText().replace("Rūšis:", "").trim(),
        numeris:        info_table.getFirstByXPath('./tr[1]/td[2]').asText().replace("Numeris:", "").trim(),
        data:           info_table.getFirstByXPath('./tr[1]/td[3]').asText().replace("Data:", "").trim(),
        kalba:          info_table.getFirstByXPath('./tr[1]/td[4]').asText().replace("Kalba:", "").trim(),
        publikavimas:   info_table.getFirstByXPath('./tr[2]/td[1]').asText().replace("Publikavimas:", "").trim(),
        statusas:       info_table.getFirstByXPath('./tr[2]/td[2]').asText().replace("Statusas:", "").trim(),
        pateike:        info_table.getFirstByXPath('./tr[3]/td').asText(),
        eurovoc:        info_table.getFirstByXPath('./tr[6]/td').asText().replace("Eurovoc 4.2 terminai:", "").trim(),
    };

    var word_link = info_table.getFirstByXPath('./tr[5]/td//a');
    if (word_link)
        info.word = word_link.getHrefAttribute();

    var links = info_table.getByXPath('./tr[4]//a').toArray();
    for each (var link in links) {
        switch (link.asText().trim()) {
            case "Susiję dokumentai":
                info.susije = link.getHrefAttribute();
            break;
            case "Susiję Europos Sąjungos teisės aktai":
                info.susije_es = link.getHrefAttribute();
        }
    } 

    doc.teises_aktas = doc.teises_aktas || {};
    for (var k in info) {
        doc.teises_aktas[k] = info[k];
    }


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
            method: "parsePage"
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
