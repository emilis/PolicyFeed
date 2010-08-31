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


// You should set values to these in your child objects:
exports._fieldNames = [];


/**
 * Returns field name array.
 * @return Array
 */
exports.getFieldNames = function()
{
    return this._fieldNames;
}


/**
 * Resets all fields to given values (removes all previous values).
 * @param Object new field values.
 */
exports.assignFields = function(data)
{
    for each (let field in this.getFieldNames())
        this[field] = data[field];
}


/**
 * Sets some fields to given values.
 * @param Object new field values.
 */
exports.updateFields = function(data)
{
    for each (let field in this.getFieldNames())
    {
        if (data[field] != undefined)
            this[field] = data[field];
    }
}


// You should implement these in your child objects:
exports.save = function () {}
exports.remove = function () {}
exports.read = function (id) {}


/**
 * Returns all field values in one object.
 * @return Object
 */
exports.toObject = function()
{
    var obj = {};

    for each (let field in this.getFieldNames())
        obj[field] = this[field];
    
    return obj;
}


/**
 * Returns all field values as a JSON string.
 * @return String
 */
exports.toString = function()
{
    return JSON.stringify(this.toObject());
}


/**
 *
 */
exports.toJson = function()
{
    return JSON.stringify(this.toObject());
}
