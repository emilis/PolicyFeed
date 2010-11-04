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
var config = require("config");
var gluestick = require("gluestick");
var mail = require("ringo/mail");
var ringo_objects = require("ringo/utils/objects");
var ringo_strings = require("ringo/utils/strings");
var scheduler = require("ringo/scheduler");

// Database to use:
var db = gluestick.loadModule("DB_urls");


var log = require("ringo/logging").getLogger(module.id);

// Configuration:
module.config = config[module.id] || {
    message: {
        to: "policyfeed-errors@mailinator.com",
        from: false,
        subject: module.id + " status"
    }
};


/**
 *
 */
var last_error;


/**
 *
 */
var last_error_time;


/**
 *
 */
var last_notify_time = new Date();


// --- Init: ---
// ATTENTION: this gets executed when the module is required!
// Send new error reports every 10 minutes:
exports.scheduler = scheduler.setInterval(function () { exports.notify(); }, 10*60*1000);



// --- functions: ---


/**
 *
 */
exports.addUrl = function(url, error) {
    last_error = [url, error];
    last_error_time = new Date();
    this.save(url);

    try {
        if (url.method == "checkFeed") {
            this.notify();
        }
    } catch (e) {
        log.error("addUrl", "Failed to notify about checkFeed error.", e);
        // do nothing.
    }
}


/**
 *
 */
exports.getUrlStats = function(time) {
    if (time !== undefined)
        var rs = db.prepared_query("select count(*) as count, parser, url from errors where time > ? group by url order by count", [time]);
    else
        var rs = db.query("select count(*) as count, parser, url from errors group by url order by count");

    return db.get_all(rs);
}


/**
 *
 */
exports.getCodeStats = function(time) {
    if (time !== undefined)
        var rs = db.prepared_query("select count(*) as count, fline from errors where time > ? group by url order by count", [time]);
    else
        var rs = db.query("select count(*) as count, fline from errors group by url order by count");

    return db.get_all(rs);
}


/**
 * Returns a string with a 2d array formatted into a text table.
 */
function textTable(fields, list) {
    var sep = "\n+--------------------------------\n";

    var str = "";
    var format;
    
    str += sep;
    for (var field in fields) {
        format = fields[field];
        if (format)
            str += "| " + ringo_strings.pad(field.toString(), format[0], format[1], format[2]) + " ";
        else
            str += "| " + field + " ";
    }
    str += sep;

    str += list.map(function (item) {
            var item_str = "";
            for (var field in fields) {
                format = fields[field];
                if (format)
                    item_str += "| " + ringo_strings.pad(item[field].toString(), format[0], format[1], format[2]) + " ";
                else
                    item_str += "| " + item[field] + " ";
            }
            return item_str;
        }).join("\n");

    str += sep;

    return str;
}

/**
 *
 */
exports.showStats = function(time) {
    var str = module.id + " report\n";
    
    if (time) {
        str += "\nURLs since " + time + ":";
        str += textTable({count: [" ", 5, -1], parser : [" ", 16, 0], url: false}, this.getUrlStats(time));
    }
    str += "\nURLs total:";
    str += textTable({count: [" ", 5, -1], parser : [" ", 16, 0], url: false}, this.getUrlStats());

    if (time) {
        str += "\nCode since " + time + ":";
        str += textTable({count: [" ", 5, -1], fline: false}, this.getCodeStats(time));
    }
    str += "\nCode total:";
    str += textTable({count: [" ", 5, -1], fline: false}, this.getCodeStats());

    str += "\nLast url:\n\n";
    try {
        str += uneval(last_error);
    } catch (e) {
        str += "Unable to serialize.";
    } 

    return str;
}


/**
 *
 */
exports.save = function(url, err) {
    // Check and fix some issues with incomplete url data:
    if (!url.url)
        throw Error(module.id + ".save(): unable to save an empty url.");
    if (url.parser === undefined)
        url.parser = "unknown";
    if (!err)
        err = { fileName: "unknown", lineNumber: "0" };
    if (!url.title)
        url.title = "";

    // Write url error to DB:
    var sql = "insert into errors (time,parser,fline,url,title, data) values(?,?,?,?,?,?)";
    return db.prepared_query(sql, [
        new Date(),
        url.parser,
        err.fileName + ":" + err.lineNumber,
        url.url,
        url.title,
        uneval([url, err])
        ]);
}


/**
 *
 */
exports.removeUrl = function(url) {
    var sql = "delete from errors where url=?";
    return db.prepared_query(sql, [url]);
}


/**
 *
 */
exports.notify = function() {
    log.debug("notify", "call");
    if (this.getUrlStats(last_notify_time).length) {
        log.info("notify", "Sending message");
        this.sendMessage(this.showStats(last_notify_time));
        last_notify_time = new Date();
    }
}


/**
 *
 */
exports.sendMessage = function(text) {

    var message = ringo_objects.clone(module.config.message);
    message.text = text;

    mail.send(message);
}


