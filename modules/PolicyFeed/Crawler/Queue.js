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
var assert = require("assert");
var Errors = require("PolicyFeed/Crawler/Errors");
var jsonfs = require("ctl/objectfs/json");
var ringo_arrays = require("ringo/utils/arrays");


/**
 * 1 second delay between requests for the same host.
 */
var DEFAULT_DELAY = 1000;

/**
 * Storage path on disk:
 */
var STORAGE_PATH = "/" + module.id + "/";

//----------------------------------------------------------------------------

/**
 * Queue for urls to be done as soon as possible (lower priority).
 */
var fifo = [];

/**
 * Saves fifo queue to disk.
 */
Object.defineProperty(fifo, "save", {enumerable:false, value: function() {
    jsonfs.write(STORAGE_PATH + "fifo", this);
}});

/**
 * Loads fifo queue from disk.
 */
Object.defineProperty(fifo, "load", {enumerable:false, value: function() {
    this.length = 0;
    var stored = jsonfs.read(STORAGE_PATH + "fifo");
    if (stored && stored.length) {
        for each (var url in stored) {
            if (typeof(url) == "object")
                this.push(url);
        }
    }
}});

//----------------------------------------------------------------------------

/**
 * Queue for urls to be done on scheduled time (higher priority).
 */
var schedule = [];

/**
 * Saves schedule queue to disk.
 */
Object.defineProperty(schedule, "save", {enumerable:false, value: function() {
    jsonfs.write(STORAGE_PATH + "schedule", this);
}});


/**
 *
 */
Object.defineProperty(schedule, "hasUrl", {enumerable: false, value: function(the_url, time) {
    for each (var url in this) {
        if (url && url.url && url.url == the_url) {
            if ((time === undefined) || (time > url.time))
                return true;
        }
    }
    return false;
}});

/**
 * Loads schedule queue from disk.
 */
Object.defineProperty(schedule, "load", {enumerable:false, value: function() {
    this.length = 0;
    var stored = jsonfs.read(STORAGE_PATH + "schedule") || [];
    for each (var url in stored) {
        if (typeof(url) == "object" && url && url.url && !this.hasUrl(url.url)) {
            if (url.time && !(url.time instanceof Date)) {
                url.time = new Date(url.time);
            }
            this.push(url);
        }
    }
    this.sort(time_sort);
}});

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
                unlockPid(pid);
                return false;
            }
        }
    }

    saveLocks();
    return count == 1;
}


/**
 * Removes a locked url for a given pid.
 */
var unlockPid = function(pid) {
    locks[pid] = undefined;
    saveLocks();
}

/**
 * Saves locks to disk.
 */
var saveLocks = function() {
    jsonfs.write(STORAGE_PATH + "locks", locks);
}

/**
 * Loads locks from disk.
 */
var loadLocks = function() {
    locks = jsonfs.read(STORAGE_PATH + "locks") || {};
    delete locks._id; // this would cause errors if left intact.
    for (var pid in locks)
        exports.rescheduleUrl(pid, 0);
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
    if (!d)
        throw Error("Invalid domain requested: " + uneval(domain));
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

    schedule.load();
    fifo.load(); 
    loadLocks();
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
    url = this.makeUrl(url);

    // check if the url has fields required for processing it:
    assert.ok(url.url);
    assert.ok(url.domain);
    assert.ok(url.parser);
    assert.ok(url.method);

    fifo.push(url);
    fifo.save();
}


/**
 *
 */
exports.scheduleUrl = function(url, time) {
    if (!time)
        time = new Date();
    url = this.makeUrl(url, time);

    // check if the url has fields required for processing it:
    assert.ok(url.url);
    assert.ok(url.domain);
    assert.ok(url.time);
    assert.ok(url.parser);
    assert.ok(url.method);

    schedule.push(url);
    schedule.sort(time_sort);
    schedule.save();

}


/**
 *
 */
exports.isUrlScheduled = function(the_url, time) {
    return schedule.hasUrl(the_url, time);
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
        else if (this.requestDomain(url.domain) && lockUrl(pid, url)) {
            ringo_arrays.remove(schedule, url);
            schedule.save();
            return url;
        }
        // else continue with next url
    }
    
    // check fifo:
    for each (var url in fifo) {
        if (this.requestDomain(url.domain) && lockUrl(pid, url)) {
            ringo_arrays.remove(fifo, url);
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
exports.failedUrl = function(pid, url, err) {
    Errors.addUrl(url, err);
    unlockPid(pid);
}


/**
 * Re-schedules a locked URL for later. Returns false and removes url from locks if the url is already scheduled.
 */
exports.rescheduleUrl = function(pid, after) {
    if (this.isUrlScheduled(locks[pid].url)) {
        unlockPid(pid);
        return false;
    } else {
        this.scheduleUrl(locks[pid], new Date().getTime() + after);
        unlockPid(pid);
        return true;
    }
}


/**
 *
 */
exports.doneUrl = function(pid) {
    unlockPid(pid);
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
