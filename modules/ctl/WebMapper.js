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

// Requirements:
var config = require("config");
var gluestick = require("gluestick");
var arrays = require("ringo/utils/arrays");


// Internal vars:
var default_status = 200;
var default_headers = {
    "Content-Type": "text/html; charset=UTF-8"
};


/**
 *
 */
exports._constructor = function(config) {
    module.config = config || {
        'default_call': 'Site:showIndex',
        'allowed': [
            'Site'
            ] 
    };
}


/**
 *
 */
exports.index = function(req)
{
    return this.mapRequest(req);
}


/**
 * Decides which module function to call, based on request parameters.
 * Wraps the result in a response object.
 */
exports.mapRequest = function(req)
{
    var p = req.params || {};

    var obj_name = "";
    var action = "";

    if (typeof(p.call) == 'string' && p.call.indexOf(":") > 0)
        [obj_name, action] = p.call.split(':');
    else if (typeof(p.object) == 'string' && typeof(p.action) == 'string')
        [obj_name, action] = [p.object, p.action];
    else
        [obj_name, action] = module.config.default_call.split(':');

    if (!isCallAllowed(obj_name, action))
        [obj_name, action] = ["Site", "showError"];

    var body = gluestick.loadModule(obj_name)[action](req);

    if (typeof(body) != "string") {
        return this.returnResponse(body);
    } else {
        return this.returnResponse({
            "status":   default_status,
            "headers":  default_headers,
            "body":     [ body ]
        });
    }
}


/**
 *
 */
exports.returnHtml = function(html) {
    return {
        "status":   default_status,
        "headers":  default_headers,
        "body":     [ html ]
    };
}


/**
 *
 */
exports.returnJson = function(json) {
    if (typeof(json) != "string")
        json = JSON.stringify(json);

    return {
        status: 200,
        headers: { "Content-Type": "application/x-javascript; charset=utf-8" },
        body: [JSON.stringify(comment.toObject())]
    };
}


/**
 *
 */
exports.returnResponse = function(response) {
    if (!response.status) {
        response.status = default_status;
    }

    if (!response.headers) {
        response.headers = default_headers;
    } else {
        for (var key in default_headers) {
            if (!response.headers[key])
                response.headers[key] = default_headers[key];
        }
    }

    return response;
}


/**
 * Checks if the module function call is allowed by WebMapper configuration and module variable "web_actions".
 */
function isCallAllowed(obj_name, action)
{
    if (!arrays.contains(module.config.allowed, obj_name))
        return false;
    else
    {
        var obj = gluestick.loadModule(obj_name);
        if (typeof(obj.web_actions) == "object" && (obj.web_actions instanceof Array))
            return arrays.contains(obj.web_actions, action);
        else
            return true;
    }
}


/**
 *  Returns a response object with redirect status and header.
 */
exports.redirect = function(call) {

    return {
        'status':   301,
        'headers':  {
            Location: config.URLS.base + "/?call=" + call
        }
        'body':     []
    };
}


/**
 * Returns a response object with redirect status and header.
 */
exports.redirectToUrl = function(url) {
    return {
        "status":   301,
        "headers":  {
            Location: url
        }
        "body":     []
    };
}

