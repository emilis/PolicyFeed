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

var gluestick = require("gluestick");

exports.config = {};

exports._constructor = function(config)
{
    this.config = config;
}


/**
 * Creates an event.
 */
exports.create = function(name, data) {

    this.getCallbackList(name).map(function(call) {
        var [obj, method] = call.split(":");
        gluestick.loadModule(obj)[method](name, data);
    });
}


/**
 *
 */
exports.registerCallback = function(pattern, call)
{
    return this.config.callbacks.push([pattern, call]);
}


/**
 *
 */
exports.unregisterCallback = function(pattern, call)
{
    for (var i in this.config.callbacks)
    {
        var callback = this.config.callbacks[i];
        if (callback[0] === pattern && callback[1] === call)
            delete this.config.callbacks[i];
    }
}


//----------------------------------------------------------------------------


/**
 *
 */
exports.getCallbackList = function(event_name)
{
    if (!this.config.callbacks)
        return false;
    var result = [];
    for each (var pattern in this.config.callbacks)
    {
        if (event_name.match(pattern[0]))
            result.push( pattern[1] );
    }
    return result;
}
