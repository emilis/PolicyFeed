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

// Requirements:
var bs = require("ringo/storage/berkeleystore");


exports.Item = false;

/**
 *
 */
exports.connect = function(dir, entity_name) {
    var store = new bs.Store( dir );
    this.Item = store.defineEntity(entity_name);
}


/**
 *
 */
exports.exists = function(id) {
    return this.Item.get(id);
}


/**
 *
 */
exports.read = function(id) {
    return this.Item.get(id);
}


/**
 *
 */
exports.write = function(id, data) {
    var item;
    if (id || id === 0) {
        if (!(item = this.Item.get(id))) {
            throw Error(module.id + ".write(): object ID " + id + " does not exist in the DB. If you want a new object stored, please provide 'false' as ID, because this storage does not allow arbitrary new IDs.");
        } else {
            for (var k in data) {
                item[k] = data[k];
            }
        }
    } else {
        item = new this.Item(data);
    }

    item.save();
    return item._id;
}


/**
 *
 */
exports.remove = function(id) {
    var item = this.read(id);
    return item.remove();
}


/**
 *
 */
exports.list = function(filter, options) {
    filter = filter || {};
    options = options || {};

    var q = this.Item.query();
    
    for (var k in filter) {
        q = q.equals(k, filter[k]);
    }

    q = q.select();

    if (options) {
        return this.apply_options(q, options);
    } else {
        return q;
    }
}


/**
 *
 */
exports.apply_options = function(arr, options) {
    var {limit, offset, order, fields} = options;
    offset = offset || 0;
    order = order || {};

    if (limit) {
        arr = arr.slice(offset, limit);
    } else if (offset) {
        arr = arr.slice(offset);
    }

    // Sort the array by item fields (note that each iteration re-sorts the array again):
    for (var k in order) {
        switch (order[k]) {
            case 1:
            case undefined:
                arr.sort(function(a, b) { return a[k] > b[k]; });
                break;
            case -1:
                arr.sort(function (a, b) { return a[k] < b[k]; });
                break;
            default:
                // sort using provided comparison function:
                arr.sort(function(a, b) { return order[k](a[k], b[k]); });
        }
    }

    if (fields) {
        arr = arr.map(function(item) {
                var obj = {};
                for each (var f in fields) {
                    obj[f] = item[f];
                }
                return obj;
            });
    }

    return arr;
}



