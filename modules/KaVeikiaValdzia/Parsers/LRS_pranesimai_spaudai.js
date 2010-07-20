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

exports.disabled = true;

// Extends:
exports.extendObject("PolicyFeed/Parser");

exports.name = "LRS_pranesimai_spaudai";
exports.short_name = "LRS-PS";
exports.index_url = 'http://www3.lrs.lt/pls/inter/lrs_rss.pranesimai_spaudai';

exports.doc_template = {
    source: exports.name,
    short_source: exports.short_name
    };


/**
 *
 */
exports.extractDocumentData = function(doc)
{
    // Leave converted documents for converters to extract:
    if (doc.meta.converted_by)
        return false;

    var page = this.htmlunit.getPageFromHtml(doc.html, doc.meta.url, this.name);
    this.htmlunit.fixPageUrls(page);

    var result = {};

    // title:
    result.title = page.getFirstByXPath("/html/head/title");
    if (result.title)
        result.title = result.title.asText();
    else
        delete result.title;

    // html:
    var content = page.getElementById("divDesContent");

    var html = content.getFirstByXPath('./div/table/tbody/tr/td/div[2]');
    if (html)
        html.removeAttribute("align");
    else
        html = content.getFirstByXPath('./div/table/tbody/tr/td');

    result.html = html.asXml();

    return result;
}


