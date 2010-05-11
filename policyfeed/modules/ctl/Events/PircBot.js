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

exports.config = {};

/**
 *
 */
exports._constructor = function(config)
{
    this.config = config;
    this.channels = config.channels;

    this.bot = loadObject("ctl/irc/PircBot");

    if (this.channels)
        this.bot.joinChannels(this.channels);
}

exports.reportEvent = function(name, data)
{
    var msg = "Event:";
    msg += " " + name.replace(/\n/g, '\\n').replace(/\s+/g, "-");
    msg += " " + this.dataToString(data).replace(/\n/g, '\\n');

    return this.bot.sendMessages(this.channels, msg);
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
        return JSON.stringify(data);
    } catch (err) {}

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

