/*
    Copyright 2009,2010 Emilis Dambauskas

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

import("core/date");

var term = require("ringo/term");

exports.printEvent = function(name, data)
{
    data = uneval(data).substr(0,256);
    var time = new Date().format(Date.ISOFORMAT);

    var prefix = "";
    if (name.match(/-error/))
        prefix = term.BOLD + term.RED;
    else if (name.match(/-warn/))
        prefix = term.BOLD;
    else if (name.match(/-debug/) || name.match(/-info/))
        prefix = term.YELLOW;

    term.writeln(prefix + time + "\t" + name + "\t" + data);
}
