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

var DEFAULT_DELAY = 1000; // 1 second delay between requests for the same host.


/**
 *
 */
var fails = [];


/**
 * Queue for urls to be done as soon as possible (lower priority).
 */
var fifo = [];

/**
 * Queue for urls to be done on scheduled time (higher priority).
 */
var schedule = [];

var time_sort = function(a, b) {
    return a.time > b.time;
}

//----------------------------------------------------------------------------

/**
 * Locked url's by requesting process id.
 */
var locks = {};

var lockUrl = function(pid, url) {
    locks[pid] = url;

    var count = 0;
    for each (var u in locks) {
        if (u === url) {
            count++;
            if (count > 1)
                return false;
        }
    }
    return count == 1;
}

//----------------------------------------------------------------------------

/**
 * Register of last request time and delay for domains.
 */
var domains = {};

var requestDomain = function(domain) {
    var d = domains[domain];
    var t = new Date().getTime();
    if (t > (d.last + d.delay)) {
        d.last = t;
        return true;
    }
    else
        return false;
}


/**
 *
 */
exports.initDomains = function(domainList) {
    domains = domainList;
    for (var i in domains) {
        if (!domains[i].delay)
            domains[i].delay = DEFAULT_DELAY;
        domains[i].last = 0;
    }
}

//----------------------------------------------------------------------------

/**
 *
 */
exports.getDomainFromUrl(url) {
    var start = url.indexOf("/") + 2;
    var end = url.indexOf("/", start) - start;
    if (end < 0)
        end = url.length - start;
    return url.substr(start, end);
}


/**
 *
 */
exports.makeUrl = function(url, time) {

    if (typeof(url) == "string" || url instanceof String)
        url = { url: url };

    if (!url.domain) 
        url.domain = this.getDomainFromUrl(url.url);

    if (time)
        url.time = time;

    return url;
}

/**
 *
 */
exports.addUrl = function(url) {
    fifo.push(this.makeUrl(url));
}


/**
 *
 */
exports.sheduleUrl = function(url, time) {
    schedule.push(this.makeUrl(url, time));
    schedule.sort(time_sort);
}


/**
 *
 */
exports.getUrl = function(pid) {

    // check schedule:
    var t = new Date();
    for each (var url in schedule) {
        if (url.time > t)
            break; // exit loop when we reach urls in the future.
        else if (requestDomain(url.domain) && lockUrl(pid, url)) {
            schedule.remove(url);
            return url;
        }
        // else continue with next url
    }
    
    // check fifo:
    for each (var url in fifo) {
        if (requestDomain(url.domain) && lockUrl(pid, url)) {
            fifo.remove(url);
            return url;
        }
        // else continue with next url
    }

    return null;
}


/**
 *
 */
exports.failedUrl = function(pid, url) {
    fails.push(url);
    locks[pid] = undefined;
}


/**
 *
 */
exports.doneUrl = function(pid) {
    locks[pid] = undefined;
}
