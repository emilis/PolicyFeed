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
var ringo_arrays = require("ringo/utils/arrays");
var config = require("config");
var gluestick = require("gluestick");
var urlencode = java.net.URLEncoder.encode;

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
        'default_call': ['Site', 'showIndex'],
        'allowed': [
            'Site'
            ] 
    };
}


/**
 * Default action from config.
 */
exports.index = function(req)
{
    if (module.config)
        return this.mapRequest(req);
    else
        return gluestick.loadModule("WebMapper").mapRequest(req);
}


/**
 * Decides which module function to call, based on request parameters.
 * Wraps the result in a response object.
 */
exports.mapRequest = function(req)
{
    var p = req.params || {};
    var mod_name = "";
    var action = "";

    // Find out which module and function to call:
    if (typeof(p.call) == 'string' && p.call.indexOf(".") > 0) {
        p.call = p.call.split(".");
        action = p.call.pop();
        mod_name = p.call.join(".");
    } else if (typeof(p.module) == 'string' && typeof(p.action) == 'string') {
        [mod_name, action] = [p.module, p.action];
    } else {
        [mod_name, action] = module.config.default_call;
    }

    // Check if web clients are allowed to call this function:
    if (!isCallAllowed(mod_name, action))
        [mod_name, action] = ["Site", "showError"];

    // Get result from module function:
    var result = gluestick.loadModule(mod_name)[action](req);

    // Return result:
    if (typeof(result) != "string") {
        return this.returnResponse(result);
    } else {
        return this.returnResponse({
            "status":   default_status,
            "headers":  default_headers,
            "body":     [ result ]
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
        body: [json]
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
    if (!ringo_arrays.contains(module.config.allowed, obj_name))
        return false;
    else
    {
        var obj = gluestick.loadModule(obj_name);
        if (typeof(obj.web_actions) == "object" && (obj.web_actions instanceof Array))
            return ringo_arrays.contains(obj.web_actions, action);
        else
            return true;
    }
}


/**
 *  Returns a response object with redirect status and header.
 */
exports.redirect = function(module_name, method, params) {

    var url = config.URLS.base + "/?call=" + module_name + "." + method;

    if (params) {
        for (var key in params) {
            url += "&" + urlencode(key) + "=" + urlencode(params[key]);
        }
    }

    return {
        'status':   301,
        'headers':  { Location: url },
        'body':     []
    };
}


/**
 * Returns a response object with redirect status and header.
 */
exports.redirectToUrl = function(url) {
    return {
        "status":   301,
        "headers":  { Location: url },
        "body":     []
    };
}

