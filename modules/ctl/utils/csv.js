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
    @fileoverview Module to manipulate CSV strings.
*/

/**
 * Parses multi-line CSV string into two-dimentional array.
 *
 * @param {String} csv CSV string.
 * @param {String} optional separator Item separator character (defaults to ",").
 * @returns {Array}
 */
exports.parse = function(str, sep) {

    str = str || "";
    str = str.trim();
    sep = sep || ",";

    var lsep = "\n"; // line separator
    var quo = '"'; // quote character

    // String parameters:
    var len = str.length; // string length
    var pos = 0; // current position in string
    var cur = ""; // current item value

    // Operation modes:
    var BEGIN = 0;
    var NEXT = 1;
    var QUOTED = 2;
    var mode = BEGIN; // current mode

    // Arrays:
    var result = [];
    var line = []; // current line array

    while (pos < len) {
        switch (mode) {
            case BEGIN:
                switch (str[pos]) {
                    case " ":
                        pos++;
                    break;
                    case lsep:
                        result.push(line);
                        line = [];
                        pos++;
                    break;
                    case sep:
                        line.push("");
                        pos++;
                    break;
                    case quo:
                        mode = QUOTED;
                        cur = "";
                        pos++;
                    break;
                    default:
                        // Found item text character. Try to capture the whole item.

                        var nlpos = str.indexOf(lsep, pos); // line separator position
                        var nipos = str.indexOf(sep, pos); // item separator position

                        if ((nlpos != -1) && ((nipos == -1) || (nlpos < nipos))) {
                            // found line separator first:
                            line.push(str.slice(pos, nlpos));
                            result.push(line);
                            line = [];
                            pos = nlpos + 1;
                        } else if (nipos != -1) {
                            // found item separator first:
                            line.push(str.slice(pos, nipos));
                            pos = nipos + 1;
                        } else {
                            // found no separators:
                            line.push(str.slice(pos, len));
                            pos = len;
                        }
                }
            break;
            case QUOTED:
                // Quoted string parsing.

                // Search for next quote:
                var qpos = str.indexOf(quo, pos);

                if (qpos == -1) {
                    // Quote not found.
                    throw Error("Unclosed quote in string at " + (pos - 1));
                } else if (str[qpos + 1] == quo) {
                    // Two quotes one after another (escaped quote char):
                    cur += str.slice(pos, qpos) + quo;
                    pos = qpos + 2;
                } else {
                    // Ending quote:
                    cur += str.slice(pos, qpos);
                    line.push(cur);
                    cur = "";
                    mode = NEXT;
                    pos = qpos + 1;
                }
            break;
            case NEXT:
                // Item text has ended. Search for next item separator.
                
                switch (str[pos]) {
                    case " ":
                        pos++;
                    break;
                    case sep:
                        mode = BEGIN;
                        pos++;
                    break;
                    case lsep:
                        result.push(line);
                        line = [];
                        mode = BEGIN;
                        pos++;
                    break;
                    default:
                        throw Error("Item data found where item or line separator was expected at " + pos);
                }
            break;
            default:
                throw Error("Unknown operation mode " + mode);

        }
    }

    result.push(line);

    return result;
}

