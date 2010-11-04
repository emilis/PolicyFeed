/*
    Copyright 2010 Emilis Dambauskas

    This file is part of KaVeikiaValdzia.lt website.

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

exports.disabled = true;

exports.domains = {
    "www.lrs.lt": 3000,
    "www3.lrs.lt": 3000
};

exports.doc_template = {
};


/**
 *
 */
exports.parseNonHtml = function(original, page, url) {
    if (page.webResponse.contentType == "text/plain") {
        url.retries = url.retries ? url.retries + 1 : 1;
        if (url.retries < 10) {
            Queue.scheduleUrl(url, new Date(new Date().getTime() + 3*60*1000));
        }
        throw Error(url.parser + ".parseNonHtml: rescheduled page that is temporarily unavailable.");
    } else {
        throw Error(url.parser + ".parseNonHtml: unknown page type.");
    }
}
