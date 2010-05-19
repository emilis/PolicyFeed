/*
    Copyright 2009 Emilis Dambauskas

    This file is part of Gluestick framework.

    Gluestick framework is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Gluestick framework is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Gluestick framework.  If not, see <http://www.gnu.org/licenses/>.
*/


/*
 * NOTE! The line below makes all objects shared between requests.
 */
module.shared = true;


/**
 * Global config:
 */
import("config");


/**
 * loadObject() object cache:
 */
var cache = {};


/**
 * newObject() object template cache:
 */
var new_cache = {};


/**
 * List of interface implementations:
 */
if (config.gluestick && config.gluestick.interfaces)
    var interfaces = config.gluestick.interfaces;
else
    var interfaces = {};


/**
 * Get configuration for an object name.
 *
 * @param string name Object name
 * @param optional Object new_config Additional configuration parameters
 * @return Object Configuration for the object = config(name) + [config(interfaces[name])] + new_config.
 */
exports.getObjectConfig = function(name, new_config)
{
    /* Searches for object config in config.js.
     * E.g. getObjectConfig("my/brillant/bean") would check:
     *     config.my
     *     config.my.brillant
     *     config.my.brillant.bean
     * ... and return the result or return {};
     */
    var path = name.split("/");
    var oname = "";
    var oconfig = config;
    while (oname = path.shift())
    {
        if (oconfig[oname])
            oconfig = oconfig[oname];
        else
        {
            oconfig = {};
            break;
        }
    }

    // Apply implementation config on top of interface config:
    if (interfaces[name] != undefined)
        oconfig = oconfig.clone(this.getObjectConfig(interfaces[name]), true);

    // Apply
    return oconfig.clone(new_config, true);
}


/**
 * Get object by name.
 *
 * @param string name Object name 
 * @param optional Object new_config Additional configuration for the object.
 * @return Object An object created from the parameters.
 */
exports.loadObject = function(name, new_config)
{
    if (cache[name] != undefined)
    {
        // Return from cache if possible:
        if (cache[name]._constructor && new_config)
        {
            // Return a clone with additional configuration:
            var obj = cache[name].clone(false, true);
            obj._constructor(this.getObjectConfig(name, new_config));
            return obj
        }
        else
            // Return from cache:
            return cache[name]
    }
    else
    {
        // Cache miss.
        if (interfaces[name] != undefined)
            // Require an implementation of an interface:
            var obj = newObject(name, new_config); //require(interfaces[name]);
        else
        {
            var obj = require(name);

            // Execute _constructor() method if exists:
            if (obj._constructor)
                obj._constructor(this.getObjectConfig(name, new_config));
        }

        if (new_config != undefined)
            // Do not cache objects with custom config:
            return obj;
        else
        {
            // Save in cache:
            cache[name] = obj;
            return cache[name];
        }
    }
}


/**
 * Get a new object instance by name.
 *
 * @param string name Object name 
 * @param optional Object new_config Additional configuration for the object.
 */
exports.newObject = function(name, new_config)
{
    if (!new_cache[name])
    {
        // Create a template in cache:
        if (interfaces[name] != undefined)
            // Require an implementation of an interface:
            new_cache[name] = require(interfaces[name]);
        else
            new_cache[name] = require(name);
    }

    var obj = new_cache[name].clone(false, true);
    
    if (obj._constructor)
        obj._constructor(this.getObjectConfig(name, new_config));

    return obj;
}


/**
 * Empties all caches.
 */
exports.clearCache = function()
{
    cache = {};
    new_cache = {};
}


/**
 * Provides a crutch for people needing OOP class extension mechanism.
 *
 * @param mixed parentObject Parent object or parent object name.
 */
exports.extendObject = function(parentObject)
{
    if (typeof(parentObject) == "string")
        parentObject = require(parentObject);

    for (var propName in parentObject)
    {
        if (parentObject[propName] != undefined && parentObject[propName].constructor == Object)
            this[propName] = parentObject[propName].clone(false, true);
        else
            this[propName] = parentObject[propName];
    }

    this._parent = parentObject;
}



