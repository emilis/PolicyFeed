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

require("htmlunit");

exports.filter = function(page) {
    if (typeof(page) == "string" || !page.asXml) {
        html = htmlunit.getPageFromHtml(page, "http://example.org/", "default", "UTF-8")
    }

    page.executeJavaScript(uneval(this.fixAbiwordHtmlFunction) + "()");
    
    return page.getBody().asXml().replace(/%26/g, "&");
}


/**
 * WARNING: this function is executed "client-side".
 */
exports.fixAbiwordHtmlFunction = function()
{
    // remove tags with contents:
    jQuery("colgroup").remove();
    jQuery("div#header").remove();
    jQuery("div#footer").remove();

    jQuery("table").removeAttr("cellpadding"); // move this to a separate function
    jQuery("p").removeAttr("awml:style");

    // set attributes:
    jQuery("table").attr("border", "1");
}


