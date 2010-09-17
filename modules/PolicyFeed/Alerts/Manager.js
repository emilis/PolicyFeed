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
var Alerts = require("PolicyFeed/Alerts");
var EmailAuth = require("PolicyFeed/EmailAuth");
var gluestick = require("gluestick");
var ringo_dates = require("ringo/utils/dates");

gluestick.extendModule(exports, "ctl/Controller");

exports.tpl_dir = exports.getTplDir(module);


/**
 *
 */
exports.showList = function(req) {

    var email = req.params.email;
    if (!email)
        return this.showError(404);

    if (!EmailAuth.isLoggedIn(req, email)) {
        EmailAuth.askForLogin(email, module.id, "showList", "peržiūrėti užsakytų pranešimų sąrašą.", {email: email});
        return this.showContent("showList-preview");
    }

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

    var email = req.params.email;

    if (!EmailAuth.isLoggedIn(req, email)) {
        EmailAuth.askForLogin(
            email,
            module.id,
            "addAlert",
            "užsakyti pranešimus atitinkančius paiešką:\n\n    " + req.params.query + "\n\njūsų el. pašto adresu",
            { email: email, query: req.params.query});

        if (req.params.format == "json") {
            return this.WebMapper.returnJson({ message: "Paprašysime jūsų patvirtinti šį užsakymą el. paštu." });
        } else {
            return this.showMessage("Prašome patvirtinti savo užsakymą.",
                    "Išsiuntėme jums el. laišką, kuriame yra nuoroda, kurią paspaudę galėsite patvirtinti savo užsakymą."
                    );
        }
    }

    var alert = {
        email: req.params.email,
        query: req.params.query,
        time: ringo_dates.format(new Date(), "yyyy-MM-dd HH:mm:ss")
    };

    alert.id = Alerts.create(false, alert);

    if (req.params.format == "json") {
        return this.WebMapper.returnJson({
                message: "Pranešimai užsakyti.",
                link: this.WebMapper.getUrl(module.id, "showList", {email: alert.email }),
                alert: alert
                });
    } else {
        return this.WebMapper.redirect(module.id, "showList", {
                email: email,
                message: "Pranešimai užsakyti."
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

    if (!EmailAuth.isLoggedIn(req, alert.email)) {
        return this.showError(403);
    }

    Alerts.remove(id);

    return this.WebMapper.redirect(module.id, "showList", {
        email: alert.email,
        message: 'Pranešimų užsakymas panaikintas. Užklausa: <em>' + alert.query + '</em>.'
        });
}


/**
 *
 */
exports.showMessage = function(title, body) {
    return this.showContent("showMessage", { title: title, body: body });
}
