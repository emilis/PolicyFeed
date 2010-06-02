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


module.shared = true;

/**
 * Period to check for new urls when idle.
 */
var WAITASEC = 2000;


var setTimeout = require("ringo/scheduler").setTimeout;
var htmlunit = require("htmlunit");

var UrlQueue;
var SourceList;


/**
 *
 */
exports.init = function(source_list, url_queue) {
    SourceList = source_list;
    UrlQueue = url_queue;
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
        this.newThread(prefix + i);
}


/**
 *
 */
exports.newThread = function(id) {
    return setTimeout(this.runThread(id), 0);
}


/**
 *
 */
exports.runThread = function(id) 
    return function() {
        var url = UrlQueue.getUrl(id);
        if (!url)
            return setTimeout(this.runThread(id), WAITASEC);

        try {
            var page = htmlunit.getPage(url.url, id);
            SourceList.processUrl(url, page);
        } catch (e) {
            url.pid = id;
            url.exception = e;
            UrlQueue.failedUrl(id, url);
            print(e);
        } finally {
            setTimeout(this.runThread(id), 0);
        }
    }
}
