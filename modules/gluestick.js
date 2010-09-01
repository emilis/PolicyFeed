/*
    Copyright 2009,2010 Emilis Dambauskas

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

var config = require("config");
var objects = require("ringo/utils/objects");


/**
 * Dictionary of loaded module names.
 */
var loaded = {};


/**
 * Interface configuration and cache:
 */
if (config.gluestick && config.gluestick.interfaces)
    var interfaces = config.gluestick.interfaces;
else
    var interfaces = {};

// Prepare interfaces:
for (var name in interfaces) {
    if (typeof(interfaces[name]) == "string") {
        interfaces[name] = {
            module: interfaces[name],
            clone: false,
            config: {},
            configured: false
        };
    }
}


/**
 *
 */
var loadInterfaceConfig = function(name) {
    var iface = interfaces[name];
    
    if (!iface) {
        throw Error(module.id + ".loadInterfaceConfig() error: interface '" + name + "' does not exist!");
    }
    
    if (!iface.configured) {
        iface.config = iface.config || {};
        var mod_config = config[iface.module] || {};
        iface.config = objects.clone(mod_config, iface.config);
        iface.configured = true;
    }

    return iface.config;

}

/**
 *
 */
exports.getModuleConfig = function(name, new_config) {

    var new_config = new_config || {};

    if (interfaces[name]) {
        return objects.clone(loadInterfaceConfig(name), new_config);
    } else {
        return objects.clone(mod_config, new_config);
    }
}


/**
 *
 */
exports.extendModule = function(child, with_parent) {
    return objects.clone(require(with_parent), child, true);
}


/**
 *
 */
exports.constructModule = function(module_name, config) {
    var mod = require(module_name);
    if (mod._constructor)
        mod._constructor(config);
    return mod;
}


/**
 *
 */
exports.constructModuleClone = function(module_name, config) {
    var mod = objects.clone(require(module_name), false, true);
    if (mod._constructor)
        mod._constructor(config);
    return mod;
}


/**
 *
 */
exports.loadModule = function(name, config) {

    if (config) {
        config = this.getModuleConfig(name, config);
        name = (interfaces[name]) ? interfaces[name].module : name;
        return this.constructModuleClone(name, config);
    } else {
        if (interfaces[name]) {
            var iface = interfaces[name];
            if (!iface.obj) {
                // Cache loaded module object in corresponding config variable:
                if (iface.clone)
                    iface.obj = this.constructModuleClone(iface.module, this.getModuleConfig(name));
                else
                    iface.obj = this.constructModule(iface.module, this.getModuleConfig(name));
            }
            return iface.obj;
        } else {
            if (!loaded[name]) {
                var obj = this.constructModule(name, this.getModuleConfig(name));
                loaded[name] = true; // Cache loaded state so that we do not construct modules every time we load them.
                return obj;
            } else {
                return require(name);
            }
        }
    }
}


/**
 *
 */
exports.cloneModule = function(name, config) {
    var obj = objects.clone(this.loadModule(name), false, true);
    if (config) {
        config = this.getModuleConfig(name, config);
    }
    obj._constructor(config);
    return obj;
}


