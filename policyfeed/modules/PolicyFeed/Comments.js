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

import("config");


/**
 *
 */
exports.showThread = function(id)
{
    return this.getHtml('showThread', {
            "config": config,
            "thread_id": id,
            "comments": newObject("PolicyFeed/Comments/List").selectByThread(id)
            });
}


/**
 *
 */
exports.submitComment = function(req)
{
    print("PolicyFeed/Comments.submitComment", JSON.stringify(req.params), loadObject("ctl/Request").getRemoteAddr(req));

    var comment = newObject("PolicyFeed/Comments/Item");
    comment.updateFields(req.params);
    comment.parent_id = comment.parent_id || 0;
    comment.user_id = null;
    comment.updated = null;
    comment.score = 1;

    if (comment.validate())
        comment.save();

    return {
        status: 200,
        headers: { "Content-Type": "application/x-javascript; charset=utf-8" },
        body: [JSON.stringify(comment.toObject())]
    };
}


/**
 *
 */
exports.getHtml = function(tpl, vars)
{
    var tpl_name = config.MODULES_DIR + "/PolicyFeed/Comments/tpl/" + tpl + ".ejs";
    return loadObject("ctl/Template").fetch(tpl_name, vars);
}
