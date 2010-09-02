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

// Requirements:
var gluestick = require("gluestick");
var jsonfs = require("ctl/objectfs/json");
var ringo_dates = require("ringo/utils/dates");

// Extend module:
gluestick.extendModule(exports, "ctl/Controller");


/**
 * Directory with template files.
 */
exports.tpl_dir = exports.getTplDir(module);


/**
 * Returns JSON web response for month days containing documents.
 */
exports.getActiveDays = function(req)
{
    return this.WebMapper.returnJson(
        this.getActiveMonthDays(req.params.year, req.params.month)
        );
}


/**
 * Calendar block.
 */
exports.showBlock = function(day) {
    if (!day)
        day = ringo_dates.format(new Date(), "yyyy-MM");

    return this.showHtml("showBlock", {
        day: day,
        days: this.getActiveMonthDays(day.substr(0, 4), day.substr(5, 2))
        });
}


/**
 *
 */
exports.getActiveMonthDays = function(year, month)
{
    if (month < 10 && month.length != 2)
        month = "0" + month;

    var result = [];
    try {
        result = jsonfs.listDirectories("/docs/" + year + "/" + month);
    } catch (e) {
        result = [];
    }

    return result;
}
