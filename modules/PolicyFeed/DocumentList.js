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

// Extends:
exports.extendObject("ctl/DataObject/DbRowList");

// Row object:
exports.dataObjectName = "PolicyFeed/Document";

exports._constructor();

require("core/date");


/**
 * Returns a generator yielding latest documents.
 */
exports.getLatest = function(n)
{
    if (typeof(n) != "number")
        n = 50;

    var db = this.getDb();
    
    this.pos = 0;
    var sql = "SELECT id,original_id,updated,published,comment_count,meta FROM `" + this.getTableName() + "` ORDER BY published DESC LIMIT " + this.pos + "," + n;
    var rs = db.query(sql);

    if (!rs.first())
        throw StopIteration;
    else
        rs.beforeFirst();

    try
    {
        while (rs.next())
        {
            var doc = this.newDataObject();
            doc.assignFields(db.get_row(rs));
            yield doc;
        }
    }
    finally
    {
        rs.getStatement().close();
    }
}


/**
 *
 */
exports.getByDate = function(day)
{
    var db = this.getDb();
    var sql = "SELECT id,published,comment_count,meta FROM `" + this.getTableName() + "` WHERE published LIKE ? ORDER BY published DESC";
    var rs = db.prepared_query(sql, [day + "%"]);

    if (!rs.first())
        throw StopIteration;
    else
        rs.beforeFirst();

    try
    {
        while (rs.next())
        {
            var doc = this.newDataObject();
            doc.assignFields(db.get_row(rs));
            yield doc;
        }
    }
    finally
    {
        rs.getStatement().close();
    }
}


/**
 *
 */
exports.search = function(str)
{
    var sql = "SELECT id,published,comment_count,meta FROM `" + this.getTableName() + "` WHERE html LIKE ? OR meta LIKE ? ORDER BY published DESC LIMIT 0,100";
    str = "%" + str + "%";
    return this.query(sql, [str, str]);
}


/**
 * Returns a list of month days that contains documents in the given year and month.
 * @param number year Year
 * @param number month Month
 * @return Array List of month days.
 */
exports.getActiveMonthDays = function(year, month)
{
    var sql = "select distinct DAYOFMONTH(published) as day from docs where published between ? and ?";
    var db = this.getDb();

    var d = new Date(year, month - 1, 1);
    
    var first_day = d.format("yyyy-MM-dd");

    d.setTime(d.getTime() + Date.ONEMONTH + Date.ONEDAY);
    d.setDate(1);
    var next_month = d.format("yyyy-MM-dd");

    var rs = db.prepared_query(sql, [first_day, next_month]);
    
    // note that db.get_all closes rs automaticly:
    return db.get_all(rs).map(
        // extract "day" column:
        function (day) { return day.day; }
        );
}
