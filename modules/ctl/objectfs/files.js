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
    @fileoverview Abstract module for storing objects in files.
*/

// Requirements:
var config = require("config");
var fs = require("fs");

// Things that need to be changed in child modules:
exports.file_dir = config.DIRS.data + "/" + module.id;
exports.extension = ".dat";
exports.serialize = function (obj) { return uneval(obj) };
exports.unserialize = function (str) { return eval(str) };

/**
 * This function sets up child module vars:
 */
exports.setup = function(module_id, extension) {

    if (config[module_id] && config[module_id].file_dir)
        this.file_dir = config[module_id].file_dir;
    else
        this.file_dir = config.DIRS.data + "/" + module_id;

    this.extension = extension;
}


/**
 * 
 */
exports.triggers = {
    onRead: [],     afterRead: [],
    onWrite: [],    afterWrite: [],
    onCreate: [],   afterCreate: [],
    onUpdate: [],   afterUpdate: [],
    onRemove: [],   afterRemove: []
};


// --- File operations: ---


/**
 * Returns a canonical path for the item.
 *
 * @param {String} path
 * @returns {String}
 */
exports.canonical = function(id) {
    return fs.canonical("/" + id);
}

/**
 * Converts objectfs path into a file system path.
 *
 * @param {String} id Canoical path in objectfs.
 * @returns {string}
 */
exports.getFileName = function(id) {
    return this.file_dir + id + this.extension;
}

/**
 * Checks if a data file exists for the given path.
 *
 * @param {String} id Canonical path in objectfs.
 * @returns {Boolean}
 */
exports.exists = function(id) {
    return fs.exists(this.getFileName(id));
}


/**
 * Returns data stored in the given path.
 *
 * @param {String} id Path in objectfs.
 * @returns {Object|Boolean} Data or false
 */
exports.read = function(id) {
    id = this.canonical(id);

    this.runTriggers("onRead", id, false);

    if (!this.exists(id)) {
        return false;
    } else {
        try {
            var data = this.unserialize(fs.read(this.getFileName(id)));
            data._id = id;
        } catch (e) {
            e.message = module.id + ".read(" + id + "): Unable to unserialize file data for object. Original error: " + e.message;
            throw e;
        }

        this.runTriggers("afterRead", id, data);
        return data;
    }
}


/**
 * Removes an object from the objectfs.
 * todo: add parameter for recursive removal.
 *
 * @param {String} id Object path in objectfs.
 * @returns {Boolean}
 */
exports.remove = function(id) {
    id = this.canonical(id);

    this.runTriggers("onRemove", id, false);
    if (!this.exists(id)) {
        return false;
    }

    fs.remove(this.getFileName(id));
    this.runTriggers("afterRemove", id, false);

    return true;
}


/**
 * Writes an object to the objectfs.
 *
 * @param {Strin}g id Path in which to store the data.
 * @param {Object} data Data to write (anything that can be searialized into approptiate format).
 * @returns {Boolean} Throws Error on failure.
 */
exports.write = function(id, data) {
    id = this.canonical(id);

    var existed = this.exists(id);

    this.runTriggers("onWrite", id, data);
    this.runTriggers(
            existed ? "onUpdate" : "onCreate",
            id, data);
        
    try {
        var text = this.serialize(data);
    } catch (e) {
        e.message = module.id + ".write(" + id + "): Unable to serialize data for object. Original error: " + e.message;
        throw e;
    }

    var file_name = this.getFileName(id);
    fs.makeTree(fs.directory(file_name));
    fs.write(file_name, text);

    this.runTriggers("afterWrite", id, data);
    this.runTriggers(
            existed ? "afterUpdate" : "afterCreate",
            id, data);

    return true;
}


/**
 * Creates a new object in the objectfs.
 *
 * @param {String} id
 * @param {Object} data
 * @returns {Boolean} False if object already exists or write failed.
 */
exports.create = function(id, data) {
    id = this.canonical(id);
    if (this.exists(id))
        return false;
    else
        return this.write(id, data);
}


/**
 * Updates an existing object in the objectfs.
 *
 * @param {String} id
 * @param {Object} data
 * @returns {Boolean} False if the object does not exist or write failed.
 */
exports.update = function(id, data) {
    id = this.canonical(id);
    if (this.exists(id))
        return this.write(id, data);
    else
        return false;
}




/**
 * Copies the given objectfs path and its descendants to a new destination.
 *
 * @param {String} from_path
 * @param {String} to_path
 */
exports.copy = function(from, to) {
    from = this.file_dir + this.canonical(from);;
    to = this.file_dir + this.canonical(to);

    fs.makeTree(fs.directory(to));

    if (fs.isDirectory(from))
        fs.copy(from, to);

    from = from + this.extension;
    if (fs.exists(from))
        fs.copy(from, to + this.extension);
}


/**
 * Moves the given objectfs path and its descendants to a new destination.
 *
 * @param {String} from_path
 * @param {String} to_path
 */
exports.move = function(from, to) {
    from = this.file_dir + this.canonical(from);
    to = this.file_dir + this.canonical(to);

    fs.makeTree(fs.directory(to));

    if (fs.isDirectory(from))
        fs.move(from, to);

    from = from + this.extension;
    if (fs.exists(from))
        fs.move(from, to + this.extension);
}

// --- Listing ---

/**
 * List objects in path (non-recursive).
 *
 * @param {String} path
 * @returns {Array}
 */
exports.list = function(path) {
    path = this.file_dir + this.canonical(path);
    var extension = this.extension;
    return fs.list(path).filter(function (item) {
        return fs.isFile(path + "/" + item) && (item.slice(0 - extension.length) == extension);
        }).map (function (item) {
            // Remove extension:
            return item.slice(0, 0 - extension.length);
            }).sort();
}


/**
 * List directories in path (non-recursive).
 *
 * @param {String} path
 * @returns {Array}
 */
exports.listDirectories = function(path) {
    path = this.file_dir + this.canonical(path);
    return fs.list(path).filter(function (item) {
            return fs.isDirectory(path + "/" + item);
            });
}


/**
 * A generator that recursively walks files in the given directory.
 *
 * @param {String} path File system path.
 */
exports._fwd_iter = function(path) {
    for each (var item in fs.list(path).sort()) {
        item = path + "/" + item;
        if (fs.isFile(item)) {
            yield item;
        } else if (fs.isDirectory(item)) {
            for each (item in this._fwd_iter(item)) {
                yield item;
            }
        }
    }
    //throw StopIteration;
}


/**
 * A generator that recursively walks files in the given directory (in reverse order).
 *
 * @param {String} path File system path.
 */
exports._rev_iter = function(path) {
    for each (var item in fs.list(path).sort().reverse()) {
        item = path + "/" + item;
        if (fs.isFile(item)) {
            yield item;
        } else if (fs.isDirectory(item)) {
            for each (item in this._rev_iter(item)) {
                yield item;
            }
        }
    }
    //throw StopIteration;
}


/**
 * Creates a generator for walking the objects in given path (recursively).
 *
 * @param String path Path inside objectfs.
 * @param Object options
 * @return generator
 *
 * Options:
 *  reverse: walks files and directories in reverse order.
 *  pattern: RegExp -- only matching paths are returned.
 *  limit: number of files to walk until stopping iteration.
 */
exports.iterate = function(path, options) {
    options = options || {};
    var { reverse, pattern, limit} = options;

    // prepend path, remove trailing slash:
    path = this.file_dir + this.canonical(path);

    if (reverse)
        var gen = this._rev_iter(path);
    else
        var gen = this._fwd_iter(path);

    for each (var fpath in gen) {
        if (pattern === undefined || fpath.match(pattern)) {
            var doc = this.unserialize(fs.read(fpath));
            doc._id = fpath.slice(this.file_dir.length, 0 - this.extension.length);
            yield doc;
        }
        if (limit !== undefined) {
            if (!limit) {
                gen.close();
                throw StopIteration;
            }
            else limit--;
        }
    }

    //throw StopIteration;
}

// --- Triggers: ---

/**
 * Create a trigger for an event. 
 */
exports.addTrigger = function(action, pattern, callback) {
    this.triggers[action] = this.triggers[action] || [];
    this.triggers[action].push([pattern, callback]);
}


/**
 * Execute callbacks registered for the event.
 */
exports.runTriggers = function(action, id, doc) {
    var triggers = this.triggers[action];
    if (triggers && triggers.length) {
        triggers.map(function( trigger ) {
           if (id.match(trigger[0])) {
               // todo: check if this closure does not produce weird errors.
               spawn(function () { trigger[1](action, id, doc); });
           }
        });
    }
}



