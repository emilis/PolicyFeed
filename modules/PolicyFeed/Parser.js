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

/**
 *
 */
exports.error = function(method, msg) {
    return Error(this.name + "." + method + " Error: " + msg);
}


/**
 *
 */
exports.validateFeedPage = function(page) {
    //todo: add checks to ensure that the feed is a valid RSS file.

    if (!page.getByXPath)
        throw this.error("validateFeedPage", page);
}


/**
 *
 */
exports.extractFeedItems = function (page) {
    this.validateFeedPage(page);

    var items = page.getByXPath("/rss/channel/item").toArray();
    if (items.length < 1) {
        return [];
    } else {
        var name = this.name;
        var doc_template = this.doc_template;

        return items.map(function (item) {
            var result = {
                url:        item.getFirstByXPath("link").asText(),
                title:      item.getFirstByXPath("title").asText(),
                published:  item.getFirstByXPath("pubDate").asText(),
                summary:    item.getFirstByXPath("description").asText()
                };

            result.published = new Date(result.published).format("yyyy-MM-dd HH:mm:ss");
            result.published = result.published.replace(/00:00:00/, new Date().format("HH:mm:ss"));

            result.parser = name;
            for (var k in doc_template)
                result[k] = doc_template[k];

            return result;
        });
    }
}



