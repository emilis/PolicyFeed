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

module.shared = true;

exports.dataObjectName = false;

exports.list = new Array();
exports.pos = 0;


exports.newDataObject = function()
{
    return newObject(this.dataObjectName);
}


exports.length = function()
{
    return this.list.length;
}

exports.seek = function(index)
{
    if (index in this.list)
        return this.list[index];
    else
        return false;
}

exports.rewind = function()
{
    this.pos = 0;
}

exports.current = function()
{
    return this.list[this.pos];
}

exports.key = function()
{
    return this.pos;
}

/*
 * This would conflict with JavaScript Generator methods.
exports.next = function()
{
    this.pos++;
}
*/

exports.valid = function()
{
    return (this.pos in this.list);
}

exports.getGenerator = function()
{
    this.rewind();
    while (this.valid())
    {
        yield this.current();
        this.pos++;
    }
}
