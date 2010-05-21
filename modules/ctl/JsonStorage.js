/*
    Copyright 2010 Emilis Dambauskas

    This file is part of Cheap Tricks Library for RingoJS.

    Cheap Tricks Library is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Cheap Tricks Library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Cheap Tricks Library.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
    <sarcasm>Yet another no-sql database. Oh wow!</sarcasm>

    This module stores anything you give it in json files.

    Function names are copied from "fs" module, except for iterate() -- 
    it accepts options and returns a recursive generator.

    You can also add triggers to write/remove events.

    Pros:
        - No external servers needed. Works with file system.

    Cons:
        - No methods for search within objects.
*/

module.shared = true;

import("config");
import("fs");
import("ringo/scheduler");

/**
 * Path where document data is stored.
 * todo: let configure this dir.
 */
var path = config.DATA_DIR + "/JsonStorage/";


/**
 * 
 */
var triggers = {
    "before-write": []
    ,"after-write": []
    ,"before-remove": []
    ,"after-remove": []
};


// --- File operations: ---


/**
 * Converts JsonStorage path into a file system path.
 *
 * @param String id Path in JsonStorage.
 */
exports.getFileName = function(id) {
    return path + id + ".json";
}

/**
 * Checks if a data file exists for the given path.
 *
 * @param String id Path in JsonStorage.
 */
exports.exists = function(id) {
    return fs.exists(this.getFileName(id));
}


/**
 * Returns data stored in the given path.
 *
 * @param String id Path in JsonStorage.
 */
exports.read = function(id) {
    if (!this.exists(id)) {
        return false;
    }
    else {
        var doc;
        if (doc = JSON.parse(fs.read(this.getFileName(id))) ) {
            return doc;
        }
        else {
            return this.error("read", id);
        }
    }
}


/**
 * Removes an object from the JsonStorage.
 *
 * @param String id Object path in JsonStorage.
 */
exports.remove = function(id) {
    if (!this.exists(id)) {
        return false;
    }

    this.runTriggers("before-remove", id, false);
    fs.remove(this.getFileName(id));
    this.runTriggers("after-remove", id, false);

    return true;
}


/**
 * Writes an object to the JsonStorage.
 *
 * @param String id Path in which to store the data.
 * @param mixed data Data to write (anything that can be searialized into JSON).
 */
exports.write = function(id, data) {
    this.runTriggers("before-write", id, data);

    var file_name = this.getFileName(id);
    fs.makeTree(fs.directory(file_name));
    fs.write(file_name, JSON.stringify(data));

    this.runTriggers("after-write", id, data);
    return true;
}


/**
 * Copies the given JsonStorage path and its descendants to a new destination.
 */
exports.copy = function(from, to) {
    from = path + from;
    if (fs.isDirectory(from))
        fs.copy(from, path + to);

    from = from + ".json";
    if (fs.exists(from))
        fs.copy(from, path + to + ".json");
}


/**
 * Moves the given JsonStorage path and its descendants to a new destination.
 */
exports.move = function(from, to) {
    from = path + from;
    if (fs.isDirectory(from))
        fs.move(from, path + to);

    from = from + ".json";
    if (fs.exists(from))
        fs.move(from, path + to + ".json");
}

// --- Listing ---

/**
 * Lists all directories and files in the given JsonStorage path.
 */
exports.list = function(upath) {
    upath = path + upath;
    return fs.list(upath).sort();
}


/**
 * A generator that recursively walks files in the given directory.
 *
 * @param String path File system path.
 */
var fwd_iter = function(path) {
    for each (var item in fs.list(path).sort()) {
        item = path + "/" + item;
        if (fs.isFile(item))
            yield item;
        else if (fs.isDirectory(item)) {
            for each (item in fwd_iter(item))
                yield item;
        }
    }
    throw StopIteration;
}


/**
 * A generator that recursively walks files in the given directory (in reverse order).
 *
 * @param String path File system path.
 */
var rev_iter = function(path) {
    for each (var item in fs.list(path).sort().reverse()) {
        item = path + "/" + item;
        if (fs.isFile(item))
            yield item;
        else if (fs.isDirectory(item)) {
            for each (item in rev_iter(item))
                yield item;
        }
    }
    throw StopIteration;
}


/**
 * Creates a generator for walking the files in the directory tree.
 *
 * @param String upath Path inside JsonStorage.
 * @param Object options
 * @return generator
 *
 * Options:
 *  reverse: walks files and directories in reverse order.
 *  pattern: RegExp -- only matching paths are returned.
 *  limit: number of files to walk until stopping iteration.
 */
exports.iterate = function(upath, options) {
    options = options || {};
    var { reverse, pattern, limit} = options;

    upath = path + upath;

    if (reverse)
        var gen = rev_iter(upath);
    else
        var gen = fwd_iter(upath);

    for each (var fpath in gen) {
        if (pattern === undefined || fpath.match(pattern))
            yield JSON.parse(fs.read(fpath));
        if (limit !== undefined) {
            if (!limit) {
                gen.close();
                throw StopIteration;
            }
            else limit--;
        }
    }

    throw StopIteration;
}

// --- Triggers: ---

/**
 *
 */
exports.addTrigger = function(action, pattern, callback) {
    triggers[action].push([pattern, callback]);
}


/**
 *
 */
exports.runTriggers = function(action, id, doc) {
    for each (var trigger in triggers[action]) {
       if (id.match(trigger[0])) {
           // todo: check if this closure does not produce weird errors.
           scheduler.setTimeout(function () { trigger[1](action, id, doc); }, 0);
       }
    }
}


