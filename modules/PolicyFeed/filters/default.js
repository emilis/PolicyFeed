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

var replace = [
    [ /<([^>]+)\slang="[^"]*"/gi, "<$1"],
    [ /<([^>]+)\sstyle="[^"]*"/gi, "<$1"],
    [ /<([^>]+)\sdir="[^"]*"/gi, "<$1"],
    [ /<([^>]+)\sclass="[^"]*"/gi, "<$1"],
    [ /<([^>]+)\sid="[^"]*"/gi, "<$1"] ];

exports.filter = function(html) {

    for each (var re in remove)
        html = html.replace(new RegExp(re, "gi"), "");

    for each (var re in replace) {
        html = html.replace(re[0], re[1]);
    }

    return html;
}


