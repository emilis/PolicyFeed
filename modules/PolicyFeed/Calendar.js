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

/**
 * Returns JSON web response for month days containing documents.
 */
exports.getActiveDays = function(req)
{
    return {
        status: 200,
        headers: {
            "Content-type": "application/x-javascript-data"
        },
        body: [JSON.stringify( this.getActiveMonthDays(req.params.year, req.params.month) )]};
}


/**
 * Calendar block.
 */
exports.showBlock = function()
{
    var tpl_file = require("fs").directory(module.path) + "/Calendar/tpl/showBlock.ejs";

    var d = new Date();
    var year = d.getFullYear();
    var month = d.getMonth() + 1;

    return loadObject("ctl/Template").fetch(tpl_file, {
        year: year,
        month: month,
        days: this.getActiveMonthDays(year, month)
        });
}


/**
 *
 */
exports.getActiveMonthDays = function(year, month)
{
    if (month < 10)
        month = "0" + month;

    var result = [];
    try {
        result = require("ctl/JsonStorage").listDirectories("/docs/" + year + "/" + month);
    } catch (e) {
        result = [];
    }

    return result;
    //return newObject("PolicyFeed/DocumentList").getActiveMonthDays(year, month);
}
