/*
 *
 */

// todo:
//  - locking

module.shared = true;

import("config");
import("fs");
import("ringo/scheduler");

/**
 * Path where document data is stored.
 */
var path = config.DATA_DIR + "/JsonStorage/";


/**
 * 
 */
var triggers = {
    "read": []
    ,"write": []
    ,"remove": []
};


// --- File operations: ---


/**
 *
 */
exports.getFileName = function(id) {
    return path + id + ".json";
}

/**
 *
 */
exports.exists = function(id) {
    return fs.exists(this.getFileName(id));
}


/**
 *
 */
exports.read = function(id) {
    if (!this.exists(id)) {
        return false;
    }
    else {
        var doc;
        if (doc = JSON.parse(fs.read(this.getFileName(id))) ) {
            this.runTriggers("read", id, doc);
            return doc;
        }
        else {
            return this.error("read", id);
        }
    }
}


/**
 *
 */
exports.remove = function(id) {
    if (!this.exists(id)) {
        return false;
    }

    fs.remove(this.getFileName(id));
    this.runTriggers("remove", id, false);
    return true;
}


/**
 *
 */
exports.write = function(id, data) {
    var file_name = this.getFileName(id);

    fs.makeTree(fs.directory(file_name));
    fs.write(file_name, JSON.stringify(data));

    this.runTriggers("write", id, data);
    return true;
}


/**
 *
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
 *
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



