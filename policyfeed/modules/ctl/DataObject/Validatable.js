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


/**
 * Container object for object errors.
 */
exports._errors = {};

/**
 * Field indicating if errors were found during validation.
 */
exports._errors_found = false;


/**
 * Adds error to object if error value is not empty.
 */
exports.addError = function(field, value)
{
    if (value)
    {
        this._errors_found = true;
        this._errors[field] = value;
    }
}


/**
 * Runs all validate_*() functions found on this object.
 */
exports.validate = function()
{
    this._errors = {};
    this._errors_found = false;

    for (var field in this)
    {
        if (typeof(this[field]) == "function" && field.indexOf("validate_") == 0)
            this.addError(field, this[field]());
    }

    return !this._errors_found;
}


/**
 * Returns all field values in one object.
 * @return Object
 */
exports.toObject = function()
{
    var obj = {};

    for each (let field in this.getFieldNames())
        obj[field] = this[field];

    obj._errors = this._errors;
    obj._errors_found = this._errors_found;
    
    return obj;
}

