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


exports.upgradeExports = function(obj) {
    obj.serialize = obj.serialize || uneval;
    obj.unserialize = obj.unserialize || eval;

    obj._serializable_parent_create = obj.create;
    obj._serializable_parent_update = obj.update;
    obj._serializable_parent_read = obj.read;
    obj._serializable_parent_list = obj.list;

    obj.create = function(id, data) {
        return this._serializable_parent_create(id, this.serialize(data));
    }

    obj.update = function(id, data) {
        return this._serializable_parent_update(id, this.serialize(data));
    }

    obj.read = function(id) {
        var data;
        if (data = this._serializable_parent_read(id)) {
            return this.unserialize(data);
        } else {
            return data;
        }
    }

    obj.list = function(filter, options) {
        return this._serializable_parent_list(filter, options).map(this.unserialize);
    }

    if (obj.iterate) {
        obj._serializable_parent_iterate = obj.iterate;
        obj.iterate = function(filter, options) {
            var gen = this._serializable_parent_iterate(filter, options);
            for each (var item in gen) {
                yield this.unserialize(item);
            }
        }
    }
}



