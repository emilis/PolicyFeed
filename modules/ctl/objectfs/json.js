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

    Function names are mostly copied from "fs" module, except for iterate() -- 
    it accepts options and returns a recursive generator.

    You can also add triggers to write/remove events.

    Pros:
        - No external servers needed. Works with file system.

    Cons:
        - No methods for search within objects.
*/

// Extend ctl/objectfs/files:
var parent = require("ctl/objectfs/files");
for (var name in parent) {
    exports[name] = parent[name];
}

// Configure this module:
exports.setup(module.id, ".json");

exports.serialize = JSON.stringify;
exports.unserialize = JSON.parse;


