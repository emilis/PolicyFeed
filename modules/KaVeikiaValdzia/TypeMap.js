/*
    Copyright 2010 Emilis Dambauskas

    This file is part of KąVeikiaValdžia.lt website.

    KąVeikiaValdžia.lt is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    KąVeikiaValdžia.lt is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with KąVeikiaValdžia.lt.  If not, see <http://www.gnu.org/licenses/>.
*/

// Requirements:
var jsonfs = require("ctl/objectfs/json");


/**
 * Url of the online version of this data:
 */
exports.url = "https://spreadsheets.google.com/pub?key=0AsZzrrKkSKzMdC1oYnQtWGtGaFRXWnBwZFdVWjlJeXc&authkey=CIOU65QB&hl=en&single=true&gid=3&output=csv";

/**
 * Document id for storing data on disk:
 */
exports.doc_id = module.id;

/**
 * Cached version of the map:
 */
exports.map = false;


/**
 * Returns an object mapping official document types to types used in KąVeikiaValdžia.lt.
 */
exports.getMap = function() {
    if (!this.map) {
        if (!jsonfs.exists(this.doc_id)) {
            this.map = this.import();
        }
        this.map = jsonfs.read(this.doc_id);
    }
    return this.map;
}


/**
 * Updates cached data and data on disk from a given CSV filename/url.
 */
exports.import = function(url) {
    this.map = this.getDataFromCsv(url);
    jsonfs.write(this.doc_id, this.map);
    return this.map;
}


/**
 * Parse a CSV from file/url into a type map.
 */
exports.getDataFromCsv = function(url) {
    url = url || this.url;

    if (url.indexOf("://") != -1) {
        var content = require("htmlunit").getPage(url).content;
    } else {
        var content = require("fs").read(url);
    }

    var table = require("ctl/utils/csv").parse(content);
    var head = table.shift();

    var map = {};

    for each (var row in table) {
        for (var i in row) {
            map[row[i]] = head[i];
        }
    }

    return map;
}
