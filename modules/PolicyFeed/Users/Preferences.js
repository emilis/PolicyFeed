/*
    Copyright 2010 Emilis Dambauskas

    This file is part of PolicyFeed module.

    PolicyFeed is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    PolicyFeed is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with PolicyFeed.  If not, see <http://www.gnu.org/licenses/>.
*/

// Used modules:
var fs = require("fs");
var Site = loadObject("Site");
var ctlTemplate = require("ctl/Template");
var Users = require("PolicyFeed/Users");

/**
 * Directory where module template files are.
 */
var tpl_dir = fs.directory(module.path) + "/" + fs.base(module.id) + "/tpl/";


/**
 * Checks if user does not want to receive emails from our site.
 */
exports.isEmailBlocked = function(email) {
    var user = Users.getByEmail(email);
    return user.blocked;
}


/**
 *
 */
exports.showBlockForm = function(req) {
    if (!req.params.key)
        return this.showError(404);

    return this.showContent("showBlockForm", {
                user: Users.getByKey(req.params.key)
                });
}


/**
 *
 */
exports.submitBlockForm = function(req) {
    if (!req.params.key)
        return this.showError(404);
    var user = Users.getByKey(req.params.key);
    user.blocked = true;
    Users.write(user.id, user);

    return this.showBlockedOk(user);
}


/**
 *
 */
exports.showBlockedOk = function(user) {
    return this.showContent("showBlockedOk", {
            user: user
            });
}


/**
 *
 */
exports.showUnblockForm = function(req) {
     if (!req.params.key)
        return this.showError(404);

    return this.showContent("showUnblockForm", {
                user: Users.getByKey(req.params.key)
                });
}


/**
 *
 */
exports.submitUnblockForm = function(req) {
    if (!req.params.key)
        return this.showError(404);

    var user = Users.getByKey(req.params.key);
    user.blocked = false;
    user.save();

    return this.showUnblockedOk(user);
}


/**
 *
 */
exports.showUnblockedOk = function(user) {
    return this.showContent("showUnblockedOk", {
                user: user
                });
}


//----------------------------------------------------------------------------


/**
 * Show error page with (HTTP) error message.
 */
exports.showError = function(msg) {
    return Site.showError(msg);
}


/**
 * Show page inside website template.
 */
exports.showContent = function(tpl_name, vars) {
    return Site.showContent(
            ctlTemplate.fetch(
                tpl_dir + tpl_name + ".ejs",
                vars));
}
