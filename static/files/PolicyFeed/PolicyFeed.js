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


var PolicyFeed = {};

PolicyFeed.expandDocument = function(link) {
    var tr = link.parentNode.parentNode;
    if (!tr.expanded) {
        var url = link.href + ".json";
        jQuery.getJSON(url, {}, PolicyFeed.doExpandDocument(tr.id));
    } else if (tr.expanded == "expanded") {
        tr.expanded = "hidden";
        jQuery(tr).removeClass("expanded");
        jQuery(tr.nextSibling).css("display", "none");
    } else if (tr.expanded == "hidden") {
        tr.expanded = "expanded";
        jQuery(tr).addClass("expanded");
        jQuery(tr.nextSibling).css("display", "");
    }
}

PolicyFeed.doExpandDocument = function(tr_id) {
    return function(data, status) {
        var tr = document.getElementById(tr_id);

        tr.expanded = "expanded";

        jQuery(tr).addClass("expanded");
        jQuery(tr).after(
            '<tr id="' + tr_id + '-content" class="content">'
            + '<td colspan="5">' + data.html + '</td>'
            + '</tr>');
    }
}


PolicyFeed.collapseDocument = function(id) {
    var tr = document.getElementById(id);
    tr.expanded = "hidden";
    jQuery(tr).removeClass("expanded");
    jQuery("#" + tr.id + "-content").css("display", "none");
}


PolicyFeed.loadSearchResults = function(link) {
    var q = document.getElementById("q").value;

    var offset = parseInt(document.getElementById("results-shown").innerHTML, 10);
    link.offset = offset;

    document.getElementById("older-image").style.display = "";
    document.getElementById("older-image-still").style.display = "none";

    var url = WEB_URL + "/docs/search/?q=" + q + "&format=json&offset=" + offset;

    jQuery.getJSON(url, {} , PolicyFeed.doLoadSearchResults);
}


/**
 * Converts an ISO string back to Date object.
 */
function utcToLocalDate(str) {
    var arr = str.replace(/[-T:.Z]/g, "-").split("-");
    for (var i in arr) {
        arr[i] = parseInt(arr[i], 10);
    }
    arr[1]--;

    var d = Date.UTC(arr[0], arr[1], arr[2], arr[3], arr[4], arr[5]);
    d = new Date( d );
       
    var month = d.getMonth() + 1;
    if (month < 10)
        month = "0" + month;
    var day = d.getDate();
    if (day < 10)
        day = "0" + day;
    return d.getFullYear() + "-" + month + "-" + day;
}


/**
 *
 */
PolicyFeed.doLoadSearchResults = function(data, status) {
    var html = "";
    for (var i in data.docs) {
        var doc = data.docs[i];
        html += '<tr id="' + doc.id.replace(/\//g, "-") + '" class="added">';
            html += '<td class="org" nowrap="nowrap" align="right">';
                html += '<a href="/docs/search/?q=org:' + doc.org + '" title="' + doc.organization + '">' + doc.org + '&nbsp;»</a></td>';
            html += '<td class="type"><a href="/docs/search/?q=type:' + doc.type + '" title="' + doc.type + '">';
                html += '<img src="/static/files/KaVeikiaValdzia/' + doc.type + '.png"></a></td>';
            html += '<td class="title"><a href="' + doc.id + '" class="title">' + doc.title + '</a>';
                if (data.snippets[doc.id] && data.snippets[doc.id].html)
                    html += '<p>' + data.snippets[doc.id].html.join("</p><p>").replace(/-{5,}/g, "-----") + '</p>';
            html += '</td>';
            html += '<td class="time">' + utcToLocalDate(doc.published) + '</td>';
            html += '<td class="expand"><a href="' + doc.id + '" onclick="PolicyFeed.expandDocument(this);return false;">išskleisti</a></td>';
        html += '</tr>';
    }
    jQuery("#results-table > tbody").append(html);

    jQuery("tr.added").fadeIn(500);
    jQuery("tr.added").removeClass("added");

    var shown = document.getElementById("older").offset + data.docs.length;
    document.getElementById("results-shown").innerHTML = shown;
    var total = parseInt(document.getElementById("results-total").innerHTML, 10);

    if (shown >= total)
        jQuery("#results-table > tfoot").fadeOut(500);

    document.getElementById("older-image").style.display = "none";
    document.getElementById("older-image-still").style.display = "";
}
