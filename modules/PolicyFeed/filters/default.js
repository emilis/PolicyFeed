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


var remove = [
    "<span[^>]*>",
    "</span>",
    "<font[^>]*>",
    "</font>"];


var attr_start = "<([^>]+)\\s";
var attr_end = '="[^"]*"';
var attr_remove = "<$1";

var replace = [
    [ /<([^>]+)\salign="justify"/gi, attr_remove],
    [ /<pre[^>]*>/gi, '<div class="pre">']
    ];


var attributes = ["lang", "style", "dir", "class", "id"];

var html5_events = ["onafterprint", "onbeforeprint", "onbeforeonload", "onblur", "onerror", "onfocus", "onhaschange", "onload", "onmessage", "onoffline", "ononline", "onpagehide", "onpageshow", "onpopstate", "onredo", "onresize", "onstorage", "onundo", "onunload", "onblur", "onchange", "oncontextmenu", "onfocus", "onformchange", "onforminput", "oninput", "oninvalid", "onreset", "onselect", "onsubmit", "onkeydown", "onkeypress", "onkeyup", "onclick", "ondblclick", "ondrag", "ondragend", "ondragenter", "ondragleave", "ondragover", "ondragstart", "ondrop", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "onmousewheel", "onscroll", "onabort", "oncanplay", "oncanplaythrough", "ondurationchange", "onemptied", "onended", "onerror", "onloadeddata", "onloadedmetadata", "onloadstart", "onpause", "onplay", "onplaying", "onprogress", "onratechange", "onreadystatechange", "onseeked", "onseeking", "onstalled", "onsuspend", "ontimeupdate", "onvolumechange", "onwaiting"]

var ie_events = ["onactivate", "onafterupdate", "onbeforeactivate", "onbeforecopy", "onbeforecut", "onbeforedeactivate", "onbeforeeditfocus", "onbeforepaste", "onbeforeunload", "onbeforeupdate", "onbounce", "oncontrolselect", "oncopy", "oncut", "ondataavailable", "ondatasetchanged", "ondeactivate", "ondragend", "ondragleave", "ondragstart", "onerror", "onerrorupdate", "onfilterchange", "onfinish", "onfocusin", "onfocusout", "onhelp", "onlayoutcomplete", "onlosecapture", "onmouseenter", "onmouseleave", "onmove", "onmoveend", "onmovestart", "onpaste", "onpropertychange", "onreadystatechanged", "onresizeend", "onresizestart", "onrowenter", "onrowexit", "onrowsdelete", "onrowsinserted", "onselectionchange", "onstart", "onstop", "ontimeerror"


var replace_attribute = function(attr) {
    replace.push([
        new RegExp(attr_start + attr + attr_end, "gi"),
        attr_remove
        ]);
}

attributes.map(replace_attribute);
html5_events.map(replace_attribute);
ie_events.map(replace_attribute);



/**
 *
 */
exports.filter = function(html) {

    for each (var re in remove)
        html = html.replace(new RegExp(re, "gi"), "");

    for each (var re in replace) {
        html = html.replace(re[0], re[1]);
    }

    return html;
}


var remove_item = function(item) {
    item.remove();
}

/**
 *
 */
exports.filterXml = function(html) {
    // remove script elements:
    html.getByXPath("//script").toArray().map(remove_item);
    
    // remove style tags:
    html.getByXPath("//style").toArray().map(remove_item);

    /* 
    var remove_empty = ["b", "strong", "i", "em", "u", "sup", "sub", "pre", "p", "div"];

    remove_empty.map(function (tag) {
            html.getByXPath("//" + tag).toArray().map(function (element) {
                if (!element.asText().trim())
                    element.remove();
            });
        });
    */
    
    return html;
}
