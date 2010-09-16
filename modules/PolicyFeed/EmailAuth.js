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

// Requirements:
var Actions = require("PolicyFeed/EmailAuth/Actions");
var gluestick = require("gluestick");
var mail = require("ringo/mail");
var Users = require("PolicyFeed/Users");

// Extend controller:
gluestick.extendModule(exports, "ctl/Controller");

exports.tpl_dir = exports.getTplDir(module);

/**
 *
 */
exports.isLoggedIn = function(req, email) {
    if (req.session.data.user) {
        if (!email) {
            return true;
        } else {
            return (email == req.session.data.user.email);
        }
    } else {
        return false;
    }
}


/**
 *
 */
exports.getUser = function(req) {
    return req.session.data.user;
}


/**
 *
 */
exports.askForLogin = function(email, module, action, action_title, params) {
    // create delayed action:
    var id = Actions.create(false, {
            email: email,
            module: module,
            action: action,
            params: params
            });

    // send mail:
    mail.send({
            to: email,
            subject: "Prasome patvirtinti savo tapatybe",
            text: this.showHtml("askForLogin", { id: id, action_title: action_title })
            });

    return id;
}


/**
 *
 */
exports.execute = function(req) {
    var id = req.params.action;
    if (!id)
        return this.showError(404);

    Actions.remove_old();
    var action = Actions.read(id);
    if (!action)
        return this.showError(404);

    try {
        var user = Users.getByEmail(action.email);
        if (!user) {
            user = Users.create(false, { email: action.email });
            user = Users.read(user);
        }
        req.session.data.user = user;
        return this.WebMapper.redirect(action.module, action.action, action.params);
        //return require(action.module)[action.action](action.params);
    } catch (e) {
        return this.showError(501);
    }
}


/**
 *
 */
exports.login = function(req) {
    
}


/**
 *
 */
exports.logout = function(req) {
    req.session.data.user = undefined;
    return this.showError(200);
}
