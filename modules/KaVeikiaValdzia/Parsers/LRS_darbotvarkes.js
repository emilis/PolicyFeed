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

// Extends:
exports.extendObject("PolicyFeed/Parser");
// Mixins:
//exports.extractDocumentData = loadObject("PolicyFeed/sources/LRS_teises_aktai").extractDocumentData.clone(false, true);


exports.name = "LRS_darbotvarkes";
exports.short_name = "LRS-DB";
exports.index_url = 'http://www3.lrs.lt/pls/inter/w5_sale.ses_pos';

exports.doc_template = {
    source: exports.name,
    short_source: exports.short_name
    };

//------------------------------------------------------------------------

/**
 *
 */
exports.parseIndex = function(index)
{
    var path = '/html/body/div/table/tbody/tr[3]/td/table/tbody/tr/td/align/a';

    if (!index.getByXPath)
        return this.error("parseIndex", index); 
    
    var items = index.getByXPath(path).toArray();
    if (items.length < 1)
        return this.error("parseIndex", "No items found in index.");

    return items.map(this.parseIndexItem);
}


exports.parseIndexItem = function(item)
{
    return {
        url: item.getAttribute("href"),
        title: item.asText(),
        published: new Date().format("yyyy-MM-dd HH:mm:ss"),
        summary: ""
    };
}


/**
 *
 */
exports.extractDocumentData = function(doc)
{
    this.triggerEvent("extractDocumentData-debug", doc);

    if (doc.meta.converted_by)
        return false;

    var page = this.htmlunit.getPageFromHtml(doc.html, doc.meta.url, this.name);
    this.htmlunit.fixPageUrls(page);

    var result = {};

    // --- get title: ---
    result.title = page.getFirstByXPath('//caption[@class="pav"]').asText();
    if (!result.title)
        delete result.title;

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





