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


exports.list = {};

exports._constructor = function(obj_config)
{
    import("fs");
    import("config");

    if (!obj_config)
        obj_config = {};
    if (!obj_config.sources_dir)
        obj_config.sources_dir = config.MODULES_DIR + "/PolicyFeed/sources";

    var source_names = fs.list(obj_config.sources_dir);
    for each (var name in source_names)
    {
        if (name[0] != ".")
        {
            // remove ".js" extension:
            name = name.substr(0, name.length - 3);
            this.list[name] = loadObject("PolicyFeed/sources/" + name);
        }
    }
}


