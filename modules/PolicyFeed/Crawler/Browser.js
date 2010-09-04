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
var htmlunit = require("htmlunit");
var sleep = java.lang.Thread.sleep;

var log = require("ringo/logging").getLogger(module.id);


/**
 * Period to check for new urls when idle.
 */
var WAITNEWURL = 2000;
var WAITDOMAIN = 500;
var WAITNETWORK = 60*1000;


// Internal vars:
var Queue;
var Crawler;


/**
 *
 */
exports.init = function(crawler, url_queue) {
    Crawler = crawler;
    Queue = url_queue;
}


/**
 *
 */
exports.start = function(num_threads, prefix) {
    if (!num_threads)
        num_threads = 3;

    if (!prefix)
        prefix = "t";

    for (var i=1; i <= num_threads; i++)
        this.startThread(prefix + i);
}


/**
 *
 */
exports.startThread = function(id) {
    return spawn(runThread(id));
}


/**
 *
 */
var runThread = function(id) {
    return function() {
        try {
            // wait for url:
            var url = Queue.getUrl(id);
            while (!url) {
                sleep(WAITNEWURL);
                url = Queue.getUrl(id);
            }
        } catch (e) {
            log.error("runThread():getUrl", id, e, "\n", e.stack);
        }

        // process url:
        try {
            Crawler.processUrl( url, htmlunit.getPage(url.url, id) );
            Queue.doneUrl(id);
        } catch (e) {
            if (e.message.indexOf("java.net.UnknownHostException:") == 0) {
                // Add url back to queue and hope the network problems will resolve:
                Queue.rescheduleUrl(id, WAITNETWORK);
            } else {
                Queue.failedUrl(id, url, e);
                log.error("runThread():processUrl", id, e, "\n", e.stack);
            }
        } finally {
            // spawn a new thread with the same id [and exit]
            spawn(runThread(id));
        }
    }
}


/**
 *
 */
exports.getPage = function(url, id) {
    var response = defer();

    // get page
    spawn(function () {
        while (!Queue.requestDomain(url.domain))
            sleep(WAITDOMAIN);

        try {
            var page = htmlunit.getPage(url.url, id);
        } catch (e) {
            //todo
        }
        response.resolve(page);
        });

    return response.promise;
}
