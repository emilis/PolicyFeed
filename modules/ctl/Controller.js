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
    Abstract class for controllers using Site and WebMapper interfaces.
*/

// Requirements:
var gluestick = require("gluestick");
var fs = require("fs");

// Used modules:
exports.Site = gluestick.loadModule("Site");
exports.WebMapper = gluestick.loadModule("WebMapper");
exports.ctlTemplate = require("ctl/Template");
exports.ctlRequest = require("ctl/Request");


/**
 * Directory where templates are. Should be defined in child classes.
 */
exports.tpl_dir = false; 


/**
 * Returns template directory for given module.
 * @param {Object} module
 * @returns Directory path.
 * @type String
 */
exports.getTplDir = function(mod) {
    return fs.directory(mod.path) + "/" + fs.base(mod.id) + "/tpl";
   
}


/**
 * Returns HTML wrapped in Site template for given template and vars.
 * @param {String} tpl_name Template name.
 * @param {Object} vars Variables for template.
 * @returns HTML wrapped in Site template.
 * @type String
 */
exports.showContent = function(tpl_name, content) {
    var tpl_file = this.tpl_dir + "/" + tpl_name + ".ejs";
    return this.Site.showContent( this.ctlTemplate.fetchObject(tpl_file, content) );
}


/**
 * Returns HTML for given template and vars.
 * @param {String} tpl_name Template name.
 * @param {Object} vars Variables for template.
 * @returns HTML.
 * @type String
 */
exports.showHtml = function(tpl_name, content) {
    var tpl_file = this.tpl_dir + "/" + tpl_name + ".ejs";
    return this.ctlTemplate.fetch(tpl_file, content)
}


/**
 * Returns HTML response for a page.
 * @param {String} tpl_name Template name.
 * @param {Object} vars Variables for template.
 * @returns Response object.
 * @type Object
 */
exports.returnHtml = function(tpl_name, content) {
    return this.WebMapper.returnHtml( this.showContent( tpl_name, content ) );
}


/**
 * This is just a wrapper around Site.showError()
 */
exports.showError = function(msg) {
    return this.Site.showError(msg);
}


