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
var JsonStorage = require("ctl/JsonStorage");

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
 *
 */
exports.showStats = function(time) {
    var urls = this.getUrlStats(time);
    var code = this.getCodeStats(time);

    var sep = "\n+--------------------------------\n";
   
    var str = "PolicyFeed/UrlErrors report\n\n";

    str += "URLs:";
    str += sep + "| count | " + "source".pad(" ", 16, 0) + " | url" + sep;
    str += urls.map(function (item) {
            return "| " + item.count.toString().pad(" ", 5, -1)
                + " | " + item.source.pad(" ", 16, -1)
                + " | " + item.url;
            }).join("\n");
    str += sep + "\n";

    str += "Code:";
    str += sep + "| count | file:line" + sep;
    str += code.map(function (item) {
            return "| " + item.count.toString().pad(" ", 5, -1) + " | " + item.fline;
            }).join("\n");
    str += sep + "\n";

    str += "Last url:\n\n";
    str += JSON.stringify(last_error);

    return str;
}


/**
 *
 */
exports.save = function(url) {
    var sql = "insert into errors (time,source,fline,url,title) values(?,?,?,?,?)";
    var rowid = db.prepared_query(sql, [
        new Date(),
        url.source,
        url.error.fileName + ":" + url.error.lineNumber,
        url.url,
        url.title]);

    if (rowid)
        JsonStorage.write("/errors/urls/" + url.url.digest() + "/" + rowid, url);
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

    return scheduler.setTimeout(function () {
            var list = this.getUrlStats(last_notify_time);
            if (list.length) {
                notify();
                waiting = schedule();
            } else {
                waiting = schedule(current_delay - 1);
            }
        }, delays[current_delay]*60*1000);
}



