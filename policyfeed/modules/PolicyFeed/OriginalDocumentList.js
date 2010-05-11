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

exports.dataObjectName = "PolicyFeed/OriginalDocument";

exports._constructor();

exports.selectUnconverted = function()
{
    var sql = "select * from originals where id not in (select original_id from docs)";

    var db = this.getDb();
    var rs = db.query(sql);
    if (!rs.first())
        throw StopIteration;

    rs.beforeFirst();

    try
    {
        while (rs.next())
        {
            var doc = newObject("PolicyFeed/OriginalDocument");
            var data = db.get_row(rs);
            doc.assignFields(db.get_row(rs));
            yield doc;
        }
    }
    finally
    {
        rs.getStatement().close();
    }
}


