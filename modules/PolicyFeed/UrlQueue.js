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

var ErrorManager = require("PolicyFeed/ErrorManager");
var JsonStorage = require("ctl/JsonStorage");


/**
 * 1 second delay between requests for the same host.
 */
var DEFAULT_DELAY = 1000;

/**
 * Storage path on disk:
 */
var STORAGE_PATH = "/PolicyFeed/UrlQueue/";

//----------------------------------------------------------------------------

/**
 * Queue for urls to be done as soon as possible (lower priority).
 */
var fifo = [];

/**
 * Saves fifo queue to disk.
 */
fifo.save = function() {
    JsonStorage.write(STORAGE_PATH + "fifo", this);
}

/**
 * Loads fifo queue from disk.
 */
fifo.load = function() {
    this.length = 0;
    var stored = JsonStorage.read(STORAGE_PATH + "fifo");
    if (stored && stored.length) {
        for each (var url in stored)
            this.push(url);
    }
}

//----------------------------------------------------------------------------

/**
 * Queue for urls to be done on scheduled time (higher priority).
 */
var schedule = [];

/**
 * Saves schedule queue to disk.
 */
schedule.save = function() {
    JsonStorage.write(STORAGE_PATH + "schedule", this);
}

/**
 * Loads schedule queue from disk.
 */
schedule.load = function() {
    this.length = 0;
    var stored = JsonStorage.read(STORAGE_PATH + "schedule");
    if (stored && stored.length) {
        for each (var url in stored)
            this.push(url);
    }
    this.sort(time_sort);
}

/**
 * Function for sorting the schedule queue.
 */
var time_sort = function(a, b) {
    return a.time > b.time;
}

//----------------------------------------------------------------------------

/**
 * Locked url's by requesting process id.
 */
var locks = {};

/**
 * Locks url for processing.
 */
var lockUrl = function(pid, url) {
    locks[pid] = url;

    var count = 0;
    for each (var u in locks) {
        if (u === url) {
            count++;
            if (count > 1) {
                locks[pid] = undefined;
                return false;
            }
        }
    }
    return count == 1;
}

/**
 * Saves locks to disk.
 */
var saveLocks = function() {
    JsonStorage.write(STORAGE_PATH + "locks", locks);
}

/**
 * Loads locks from disk.
 */
var loadLocks = function() {
    locks = JsonStorage.read(STORAGE_PATH + "locks") || {};
}

//----------------------------------------------------------------------------

/**
 * Register of last request time and delay for domains.
 */
var domains = {};

/**
 *
 */
var initDomains = function(domainList) {
    domains = domainList;
    for (var name in domains) {
        if (!domains[name].delay)
            domains[name].delay = DEFAULT_DELAY;
        domains[name].last = 0;
    }
}

/**
 *
 */
exports.requestDomain = function requestDomain(domain) {
    var d = domains[domain];
    var t = new Date().getTime();
    if (t > (d.last + d.delay)) {
        d.last = t;
        return true;
    }
    else
        return false;
}


//----------------------------------------------------------------------------

/**
 *
 */
exports.init = function(options) {
    options = options || {};
    var {domainList} = options;

    initDomains(domainList);

    loadLocks();
    schedule.load();
    fifo.load(); 
}

/**
 *
 */
exports.getDomainFromUrl = function(url) {
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
    fifo.save();
}


/**
 *
 */
exports.scheduleUrl = function(url, time) {
    if (!time)
        time = new Date();
    schedule.push(this.makeUrl(url, time));
    schedule.sort(time_sort);
    schedule.save();

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
            schedule.save();
            return url;
        }
        // else continue with next url
    }
    
    // check fifo:
    for each (var url in fifo) {
        if (requestDomain(url.domain) && lockUrl(pid, url)) {
            fifo.remove(url);
            fifo.save();
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
    // todo: add error info to url:
    ErrorManager.addError(url);
    locks[pid] = undefined;
}


/**
 *
 */
exports.doneUrl = function(pid) {
    locks[pid] = undefined;
}


/**
 *
 */
exports.getStatus = function() {
    return {
        fifo: fifo,
        schedule: schedule,
        locks: locks,
        domains: domains
    };
}
