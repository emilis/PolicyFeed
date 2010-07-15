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

require("core/string");

var scheduler = require("ringo/scheduler");
var mail = require("ringo/mail");
var db = loadObject("DB_urls");

var MSG_TO = "policyfeed-errors@mailinator.com";


/**
 * Minutes to delay subsequent error notifications.
 */
var delays = [1,2,5,10,30,60];

/**
 *
 */
var current_delay = 0;


/**
 *
 */
var waiting = false;


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
var last_notify_time;


/**
 *
 */
exports.addUrl = function(url) {
    last_error = url;
    last_error_time = new Date();

    try {
        if (!waiting) {
            this.notify();
            waiting = this.schedule(0);
        }
    } finally {
        this.save(url);
    }
}


/**
 *
 */
exports.getUrlStats = function(time) {
    if (time !== undefined)
        var rs = db.prepared_query("select count(*) as count, source, url from errors where time > ? group by url order by count", [time]);
    else
        var rs = db.query("select count(*) as count, source, url from errors group by url order by count");

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
            str += "| " + field.toString().pad(format[0], format[1], format[2]) + " ";
        else
            str += "| " + field + " ";
    }
    str += sep;

    str += list.map(function (item) {
            var item_str = "";
            for (var field in fields) {
                format = fields[field];
                if (format)
                    item_str += "| " + item[field].toString().pad(format[0], format[1], format[2]) + " ";
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
    var str = "PolicyFeed/UrlErrors report\n";
    
    if (time) {
        str += "\nURLs since " + time + ":";
        str += textTable({count: [" ", 5, -1], source: [" ", 16, 0], url: false}, this.getUrlStats(time));
    }
    str += "\nURLs total:";
    str += textTable({count: [" ", 5, -1], source: [" ", 16, 0], url: false}, this.getUrlStats());

    if (time) {
        str += "\nCode since " + time + ":";
        str += textTable({count: [" ", 5, -1], fline: false}, this.getCodeStats(time));
    }
    str += "\nCode total:";
    str += textTable({count: [" ", 5, -1], fline: false}, this.getCodeStats());

    str += "\nLast url:\n\n";
    try {
        str += JSON.stringify(last_error);
    } catch (e) {
        try {
            str += uneval(last_error);
        } catch (e) {} 
    }

    return str;
}


/**
 *
 */
exports.save = function(url) {
    // Check and fix some issues with incomplete url data:
    if (!url.url)
        throw Error("PolicyFeed/UrlErrors.save(): unable to save an empty url.");
    if (url.source === undefined)
        url.source = "unknown";
    if (!url.error)
        url.error = { fileName: "unknown", lineNumber: "0" };
    if (!url.title)
        url.title = "";

    // Write url error to DB:
    var sql = "insert into errors (time,source,fline,url,title, data) values(?,?,?,?,?)";
    return db.prepared_query(sql, [
        new Date(),
        url.source,
        url.error.fileName + ":" + url.error.lineNumber,
        url.url,
        url.title,
        uneval(url)]);
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
    this.sendMessage(this.showStats(last_notify_time));

    last_notify_time = new Date();
}


/**
 *
 */
exports.sendMessage = function(text) {
    mail.send({to: MSG_TO, subject: "PolicyFeed/UrlErrors status", text: text});
}


/**
 *
 */
exports.schedule = function(delay) {
    if (delay !== undefined) 
        current_delay = delay;
    else
        current_delay++;

    if (current_delay > delays.length)
        current_delay = delays.length - 1;
    else if (current_delay < 0)
        return false;

    var that = this;

    return scheduler.setTimeout(function () {
            try {
                var list = that.getUrlStats(last_notify_time);
                if (list.length) {
                    that.notify();
                    waiting = that.schedule();
                } else {
                    waiting = that.schedule(current_delay - 1);
                }
            } catch (e) {
                print(new Date().toISOString(), "UrlErrors(scheduled):Error:", e);
            }
        }, delays[current_delay]*60*1000);
}



