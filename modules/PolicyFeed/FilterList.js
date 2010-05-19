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

import("fs");
import("config");
import("htmlunit");

exports.list = {};


/**
 *
 */
exports.triggerEvent = function(name, data)
{
    return loadObject("Events").create("PolicyFeed/FilterList:" + name, data);
}



/**
 *
 */
exports._constructor = function(obj_config)
{
    if (!obj_config)
        obj_config = {};
    if (!obj_config.sources_dir)
        obj_config.sources_dir = config.MODULES_DIR + "/PolicyFeed/filters";

    var source_names = fs.list(obj_config.sources_dir);
    for each (var name in source_names)
    {
        if (name[0] != ".")
        {
            // remove ".js" extension:
            name = name.substr(0, name.length - 3);
            this.list[name] = newObject("PolicyFeed/filters/" + name);
        }
    }
}


/**
 *
 */
exports.processDocument = function(doc)
{
    var wc = htmlunit.getWebClient();
    var js_enabled = wc.isJavaScriptEnabled();
    wc.setJavaScriptEnabled(true);

    var page = htmlunit.getPageFromHtml(doc.html, doc.meta.url, "filters");

    // Inject jQuery:
    var jquery = fs.read(config.LIB_DIR + "/jquery/jquery.js");
    page.executeJavaScript(jquery);

    var result = false;
    for each (var filter in this.list)
    {
        if (result = filter.processDocument(doc, page))
        {
            this.triggerEvent("processDocument-debug", ["Applied filter", filter.name, "to", doc.original_id]);
            this.triggerEvent("processDocument-debug", result[0]);
            doc.updateFields(result[0]);
            page = result[1];
            result = false;
        }
    }

    //todo: page.close() ?
    wc.setJavaScriptEnabled(js_enabled);

    return doc.toObject();
}

