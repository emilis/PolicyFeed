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

/**
 * A WebMapper module. Maps HTTP request parameters to appropriate module functions.
 */


var objects = require("ringo/utils/objects");
var arrays = require("ringo/utils/arrays");

var config = require("config").WebMapper || {
    'default_call': 'Site:showIndex',
    'allowed': [
        'Site'
        ] 
};

var default_status = 200;
var default_headers = {
    "Content-Type": "text/html; charset=UTF-8"
};

exports.status = default_status;

exports.headers = objects.clone(default_headers);

exports.req = {};


/**
 * Sets a response header.
 */
exports.header = function(name, value)
{
    this.headers[name] = value;
}


/**
 *
 */
exports.index = function(req)
{
    return loadObject("WebMapper").mapRequest(req);
}


/**
 * Decides which module function to call, based on request parameters.
 * Wraps the result in a response object.
 */
exports.mapRequest = function(req)
{
    this.status = default_status;
    this.headers = objects.clone(default_headers);

    var p = req.params || {};

    var obj_name = "";
    var action = "";

    if (typeof(p.call) == 'string' && p.call.indexOf(":") > 0)
        [obj_name, action] = p.call.split(':');
    else if (typeof(p.object) == 'string' && typeof(p.action) == 'string')
        [obj_name, action] = [p.object, p.action];
    else
        [obj_name, action] = config.default_call.split(':');

    if (!isCallAllowed(obj_name, action))
        [obj_name, action] = ["Site", "showError"];

    var body = loadObject(obj_name)[action](req);

    if (typeof(body) != "string")
        return this.returnResponse(body);
    else
        return this.returnResponse({
            "status":   this.status,
            "headers":  this.headers,
            "body":     [ body ]
        });
}


/**
 *
 */
exports.returnHtml = function(html)
{
    return this.returnResponse({
        "status":   this.status,
        "headers":  this.headers,
        "body":     [ html ]
    });
}


/**
 *
 */
exports.returnResponse = function(response)
{
    this.status = default_status;
    this.headers = objects.clone(default_headers);
    return response;
}


/**
 * Checks if the module function call is allowed by WebMapper configuration and module variable "web_actions".
 */
function isCallAllowed(obj_name, action)
{
    if (!arrays.contains(config.allowed, obj_name))
        return false;
    else
    {
        var obj = loadObject(obj_name);
        if (typeof(obj.web_actions) == "object" && (obj.web_actions instanceof Array))
            return arrays.contains(obj.web_actions, action);
        else
            return true;
    }
}


/**
 *  Returns a response object with redirect status and header.
 */
exports.redirect = function(call)
{
    this.status = 301; // Moved permanently;
    this.headers.Location = require("config").WEB_URL + "/?call=" + call;

    return this.returnResponse({
        'status':   this.status,
        'headers':  this.headers,
        'body':     []
    });
}


exports.redirectToUrl = function(url)
{
    this.status = 301; // Moved permanently;
    this.headers.Location = url;

    return this.returnResponse({
        "status":   this.status,
        "headers":  this.headers,
        "body":     []
    });
}

