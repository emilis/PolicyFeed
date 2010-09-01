/*
    Copyright 2009,2010 Emilis Dambauskas

    This file is part of Cheap Tricks Library for RingoJS.

    Cheap Tricks Library is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Cheap Tricks Library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Cheap Tricks Library.  If not, see <http://www.gnu.org/licenses/>.
*/

// Requirements:
var config = require("config");
var ringo_dates = require("ringo/utils/dates");
var fs = require("fs");

// Constants:
var LOG_DIR = config.DIRS.data + "/log";


/**
 *
 */
exports.logEvent = function(name, data)
{
    var path = LOG_DIR + ringo_dates.format(new Date(), "/yyyy/MM");
    if (!fs.exists(path))
        fs.makeTree(path);
    path += ringo_dates.format(new Date(), "/dd") + ".log";

    var stream = fs.open(path, "a+");

    name = name.replace(/\n/g, '\\n');
    data = this.dataToString(data).replace(/\n/g, '\\n');    

    stream.writeLine(ringo_dates.format(new Date(), "yyyy-MM-dd HH:mm:ss") + " " + name + " " + data);
    stream.flush();
    stream.close();
}


/**
 *
 */
exports.dataToString = function(data)
{
    if (typeof(data) == "string")
        return data;

    if (typeof(data) == "object" && (data instanceof String || data instanceof java.lang.String))
        return "" + data;

    if (data.toJson)
        return data.toJson();

    try {
        return uneval(data);
    } catch (err) {}

    if (data.toString)
        return data.toString();

    var result = "{";
    var separator = "";
    for (var k in data)
    {
        result += separator + k + ": ";
        result += this.dataToString(data[k]);
        separator = ", ";
    }

    return result;
}

