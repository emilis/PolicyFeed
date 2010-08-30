/*
    Copyright 2010 Emilis Dambauskas

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

module.shared = true;

var config = require("config");

var strings = require("ringo/utils/strings");
var bs = require("ringo/storage/berkeleystore");
var store = new bs.Store( config.DATA_DIR );

/**
 *
 */
exports.Item = store.defineEntity("UrlListItem");


/**
 *
 */
exports.exists = function(url) {
    return this.Item.query().equals("url", strings.digest(url)).select().length > 0;
}


/**
 *
 */
exports.isNew = function(url) {
    return !this.exists(url);
}


/**
 *
 */
exports.getDocId = function(url) {
    var list = this.Item.query().equals("url", strings.digest(url)).select();
    if (list.length > 0)
        return list[0].id;
}


/**
 *
 */
exports.addUrl = function(url, doc_id) {
    var item = new this.Item({url: strings.digest(url), id: doc_id});
    item.save();
    return item;
}


/**
 *
 */
exports.getUrl = function(url) {
    var list = this.Item.query().equals("url", strings.digest(url)).select();
    if (list.length > 0)
        return list[0];
}



/**
 *
 */
exports.removeUrl = function(url) {
    var item = this.getUrl(url);
    return item.remove();
}   
