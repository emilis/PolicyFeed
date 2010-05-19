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

import("fs");

// These get used a lot:
exports.dirname = fs.directory(module.path) + "/Site";
exports.template = loadObject("ctl/Template");


/**
 * Home page of the website.
 */
exports.showIndex = function(req)
{
    return loadObject("PolicyFeed").showDocumentList(req);
}


/**
 * Main template for the website.
 */
exports.showContent = function(content)
{
    if (typeof(content) == 'string')
        content = { html: content };

    content.title = content.title || "";
    content.links = content.links || this.showBlock("links");

    return this.template.fetch(this.dirname + "/tpl/showContent.ejs", content);
}


/**
 * Error page for the website.
 */
exports.showError = function(msg)
{
    if (typeof(msg) == 'undefined')
        msg = 404;

    if (typeof(msg) == "number")
        loadObject("WebMapper").status = msg;
    else
        loadObject("WebMapper").status = 501;

    return this.template.fetch(this.dirname + "/tpl/showError.ejs", { code: code });
}


/**
 * Static pages for the website.
 */
exports.showPage = function(req, name)
{
    print("Site.showPage", name, loadObject("ctl/Request").getRemoteAddr(req));

    var file_name = this.dirname + "/pages/" + name + ".ejs";

    if (!fs.exists(file_name))
        return loadObject("WebMapper").returnHtml(this.showError(404));
    else
    {
        return loadObject("WebMapper").returnHtml(
            this.showContent(
                this.template.fetchObject( file_name)));
    }
}


/**
 * HTML blocks for the website.
 */
exports.showBlock = function(name)
{
    return this.template.fetch( this.dirname + "/blocks/" + name + ".ejs" );
}

