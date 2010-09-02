/*
    Copyright 2010 Emilis Dambauskas

    This file is part of KąVeikiaValdžia.lt website.

    KąVeikiaValdžia.lt is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    KąVeikiaValdžia.lt is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with KąVeikiaValdžia.lt.  If not, see <http://www.gnu.org/licenses/>.
*/

var fs = require("fs");
var ctlTemplate = require("ctl/Template/Cached");
var ctlRequest = require("ctl/Request");
var WebMapper = require("ctl/WebMapper");

__defineGetter__("PolicyFeed", function() { return this._PolicyFeed || (this._PolicyFeed = require("PolicyFeed")) });


// These get used a lot:
exports.dirname = fs.directory(module.path) + "/Site";


var log = require("ringo/logging").getLogger(module.id);

/**
 * Home page of the website.
 */
exports.showIndex = function(req) {
    return PolicyFeed.showDocumentList(req);
}


/**
 * Main template for the website.
 */
exports.showContent = function(content) {
    if (typeof(content) == 'string')
        content = { html: content };

    content.title = content.title || "";
    content.links = content.links || this.showBlock("links");

    return ctlTemplate.fetch(this.dirname + "/tpl/showContent.ejs", content);
}


/**
 * Error page for the website.
 */
exports.showError = function(msg) {
    if (typeof(msg) == 'undefined')
        msg = 404;

    if (typeof(msg) == "number")
        var status = msg;
    else
        var status = 501;

    return {
        status: status,
        headers: {},
        body: [ ctlTemplate.fetch(this.dirname + "/tpl/showError.ejs", { code: msg }) ]
    };
}


/**
 * Static pages for the website.
 */
exports.showPage = function(req, name) {
    log.info("showPage", name, ctlRequest.getRemoteAddr(req));

    var file_name = this.dirname + "/pages/" + name + ".ejs";

    if (!fs.exists(file_name))
        return this.showError(404);
    else
    {
        return WebMapper.returnHtml(
            this.showContent(
                ctlTemplate.fetchObject( file_name)));
    }
}


/**
 * HTML blocks for the website.
 */
exports.showBlock = function(name) {
    return ctlTemplate.fetch( this.dirname + "/blocks/" + name + ".ejs" );
}

