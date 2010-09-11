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


var Alerts = require("PolicyFeed/Alerts");
var ringo_dates = require("ringo/utils/dates");
var gluestick = require("gluestick");

gluestick.extendModule(exports, "ctl/Controller");

exports.tpl_dir = exports.getTplDir(module);


/**
 *
 */
exports.showList = function(req) {
    var email = req.params.email;

    if (!email)
        return this.showError(404);

    var list = Alerts.list({email: email}, { order: { time: 1 }});

    return this.showContent("showList", {
            list: list,
            email: email,
            message: req.params.message
            });
}


/**
 *
 */
exports.addAlert = function(req) {
    
    var alert = {
        email: req.params.email,
        query: req.params.query,
        time: ringo_dates.format(new Date(), "yyyy-MM-dd HH:mm:ss")
    };

    alert.id = Alerts.create(false, alert);

    if (req.params.format == "json") {
        return this.WebMapper.returnJson(alert);
    } else {
        return this.WebMapper.redirect(module.id, "showList", {
                email: alert.email
            });
    }
}


/**
 *
 */
exports.remove = function(req) {
    
    var id = req.params.id;
    if (!id || !Alerts.exists(id)) {
        return this.showError(404);
    }

    var alert = Alerts.read(id);

    Alerts.remove(id);

    return this.WebMapper.redirect(module.id, "showList", {
        email: alert.email,
        message: "Naujienų užsakymas ištrintas."
        });
}
