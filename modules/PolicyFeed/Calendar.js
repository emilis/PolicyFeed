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
var WebMapper = gluestick.loadModule("WebMapper");
var fs = require("fs");
var dates = require("ringo/utils/dates");
var JsonStorage = require("ctl/JsonStorage");
var ctlTemplate = require("ctl/Template");


/**
 * Returns JSON web response for month days containing documents.
 */
exports.getActiveDays = function(req)
{
    return WebMapper.returnJson(
        this.getActiveMonthDays(req.params.year, req.params.month)
        );
}


/**
 * Calendar block.
 */
exports.showBlock = function(day)
{
    var tpl_file = fs.directory(module.path) + "/Calendar/tpl/showBlock.ejs";

    if (!day)
        day = dates.format(new Date(), "yyyy-MM");

    return ctlTemplate.fetch(tpl_file, {
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
        result = JsonStorage.listDirectories("/docs/" + year + "/" + month);
    } catch (e) {
        result = [];
    }

    return result;
}
