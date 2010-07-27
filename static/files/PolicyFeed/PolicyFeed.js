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

PolicyFeed.expandDocument = function(link)
{
    var tr = link.parentNode.parentNode;
    if (!tr.expanded)
    {
        var url = link.href + ".json";
        jQuery.getJSON(url, {}, PolicyFeed.doExpandDocument);
    }
    else if (tr.expanded == "expanded")
    {
        tr.expanded = "hidden";
        jQuery(tr).removeClass("expanded");
        jQuery(tr.nextSibling).css("display", "none");
    }
    else if (tr.expanded == "hidden")
    {
        tr.expanded = "expanded";
        jQuery(tr).addClass("expanded");
        jQuery(tr.nextSibling).css("display", "");
    }


}

PolicyFeed.doExpandDocument = function(data, status)
{
    var tr_id = data._id.replace(/\//g, "-");
    var tr = document.getElementById(tr_id);

    tr.expanded = "expanded";

    jQuery(tr).addClass("expanded");
    jQuery(tr).after(
        '<tr id="' + tr_id + '-content" class="content">'
        + '<td colspan="4">' + data.html + '</td>'
        + '</tr>');
}


PolicyFeed.collapseDocument = function(id)
{
    var tr = document.getElementById(id);
    tr.expanded = "hidden";
    jQuery(tr).removeClass("expanded");
    jQuery("#" + tr.id + "-content").css("display", "none");
}

