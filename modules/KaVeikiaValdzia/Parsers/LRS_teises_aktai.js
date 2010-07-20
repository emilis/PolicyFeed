/*
    Copyright 2009,2010 Emilis Dambauskas

    This file is part of PolicyFeed module.

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

require("core/date");


exports.disabled = true;


exports.extendObject("PolicyFeed/Parser");

exports.name = "LRS_teises_aktai";
exports.short_name = "LRS-TA";
exports.index_url = 'http://www3.lrs.lt/pls/inter/lrs_rss.teises_aktai';

exports.doc_template = {
    source: exports.name,
    short_source: exports.short_name
    };


/**
 *
 */
exports.parseIndexItem = function(item)
{
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
        return this.error("parseIndexItem", ["Failed to get any url from:", link_url, guid_url, desc_url]);
    }

    // Fix 00:00 time for "published" field:
    var published = item.getFirstByXPath("pubDate").asText();
    published = published.replace(/ 00:00/, new Date().format(" HH:mm"));

    // Result object:
    return {
        url:        url,
        title:      item.getFirstByXPath("title").asText(),
        published:  published,
        summary:    item.getFirstByXPath("description").asText()
        };
}


/**
 *
 */
exports.extractDocumentData = function(doc)
{
    if (doc.meta.converted_by)
        return false;

    var page = this.htmlunit.getPageFromHtml(doc.html, doc.meta.url, this.name);
    this.htmlunit.fixPageUrls(page);

    var result = {};

    // --- get title: ---
    result.title = page.getFirstByXPath('//caption[@class="pav"]').asText();
    if (!result.title)
        delete result.title;

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



    result.teises_aktas = info;


    // --- get html: ---
    doc.html = page.asXml();
    var hr_html = '<hr style="color:#666666"/>';
    var first_hr = doc.html.indexOf(hr_html);
    var last_hr = doc.html.lastIndexOf(hr_html);

    if (first_hr < 0 || last_hr < 0 || last_hr <= first_hr)
        return this.error("extractDocumentData", ["HRs not found.", first_hr, last_hr, "IN", doc.original_id, doc.meta.url]);

    result.html = doc.html.slice(
            first_hr + hr_html.length,
            last_hr);

    return result;
}


