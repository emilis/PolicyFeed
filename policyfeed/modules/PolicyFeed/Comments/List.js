/*
    Copyright 2009,2010 Emilis Dambauskas

    This file is part of PolicyFeed module.

    PolicyFeed is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    PolicyFeed is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with PolicyFeed.  If not, see <http://www.gnu.org/licenses/>.
*/

exports.extendObject("ctl/DataObject/DbRowList");


/**
 *
 */
exports.dataObjectName = "PolicyFeed/Comments/Item";


/**
 *
 */
exports._constructor();


/**
 *
 */
exports.selectByThread = function(thread_id)
{
    var sql = "SELECT * FROM `" + this.getTableName() + "` WHERE thread_id=? ORDER BY parent_id,updated ASC";

    return this.query(sql, [thread_id]);
}
