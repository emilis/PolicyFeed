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

exports.name = "AbiWord";

exports.processDocument = function(doc, page)
{
    if (!doc.meta.converted_by || doc.meta.converted_by != "abiword")
        return false;

    var fields = {};

    page.executeJavaScript(uneval(this.fixAbiwordHtmlFunction) + "()");
    fields.html = page.getBody().asXml().replace(/%26/g, "&");

    return [fields, page];
}


/**
 * WARNING: this function is executed "client-side".
 */
exports.fixAbiwordHtmlFunction = function()
{
    // remove tags with contents:
    jQuery("colgroup").remove();
    jQuery("div#footer").remove();

    // remove the tags, keep contents:
    var tags = [];
    tags = jQuery("span");
    for (var i=0; i<tags.length; i++) { jQuery(tags[i]).replaceWith(tags[i].innerHTML) };
    tags = jQuery("font");
    for (var i=0; i<tags.length; i++) { jQuery(tags[i]).replaceWith(tags[i].innerHTML) };
    
    // remove attributes:
    jQuery("[lang]").removeAttr("lang");
    jQuery("[style]").removeAttr("style");
    jQuery("[dir]").removeAttr("dir");
    jQuery("[class]").removeAttr("class");

    jQuery("table").removeAttr("cellpadding");
    jQuery("p").removeAttr("awml:style");

    // set attributes:
    jQuery("table").attr("border", "1");
}


