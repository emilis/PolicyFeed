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
    Utility functions for strings.
 */


/**
 * Replaces pattern(s) in string using Java regular expressions.
 *
 * @param {String|Array} pattern
 * @param {String|Array} replacement
 * @param {String} string
 * @returns {String}
 */
exports.jreg_replace = function(pattern, replacement, str) {
    if (!(pattern instanceof Array))
        pattern = [pattern];
    if (!(replacement instanceof Array))
        replacement = [replacement];

    var p = "";
    var last_replacement = "";
    while (p = pattern.shift()) {
        if (replacement.length)
            last_replacement = replacement.shift();
        str = java.util.regex.Pattern.compile(p).matcher(str).replaceAll(last_replacement);
    }

    return str;
}
