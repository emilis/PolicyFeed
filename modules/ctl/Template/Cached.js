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

/*
    A proxy that caches parsed templates for ctl/Template.
    Speed improvement when running thousands of ctl/Template calls: 10x. Increased memmory usage: variable.
    Note: your app is most probably slow because of other reasons than ctl/Template.
    
    See ctl/Template documentation for usage examples.
 */


// Requirements:
var ctlTemplate = require("ctl/Template");


/**
 * Compiled template cache.
 */
var cache = {};


/**
 * Removes all or one template from cache.
 * @param String name template file name.
 */
exports.clearCache = function(name) {
    if (name)
        delete cache[name];
    else
        cache = {};
}


/**
 * Processes a template with given vars and returns output as string.
 * @param {String} template Template file name.
 * @param {Object} vars Variables for template.
 * @return Template output.
 * @type String
 */
exports.fetch = function(tpl_file_name, vars)
{
    return this.fetchObject(tpl_file_name, vars, "content")["content"];
}


/**
 * Processes a template with given vars and returns output.
 * @param {String} template Template file name.
 * @param {Object} vars Variables for template.
 * @param {String} output_param Property where output will be stored in the result (defaults to "content").
 * @return Result.
 * @type Object
 */
exports.fetchObject = function(tpl_file_name, vars, output_var_name) {

    // Create the template function in cache:
    if (!cache[tpl_file_name]) {
        cache[tpl_file_name] = ctlTemplate.fileToFunction( tpl_file_name );
    }

    // Call template function with given vars:
    try {
        return cache[tpl_file_name](vars, output_var_name);
    } catch (error) {
        error.message  = "There was an error processing cached template '" + tpl_file_name + "': " + error.message;
        throw error;
    }
}

