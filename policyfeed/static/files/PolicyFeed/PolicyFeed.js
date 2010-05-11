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
    var div = link.parentNode.parentNode;
    if (!div.expanded)
    {
        var url = link.href.substr(0, link.href.length - 1) + ".json/";
        jQuery.getJSON(url, {}, PolicyFeed.doExpandDocument);
    }
    else if (div.expanded == "expanded")
    {
        div.expanded = "hidden";
        jQuery(div).removeClass("expanded");
        jQuery("#" + div.id + "-content").css("display", "none");
    }
    else if (div.expanded == "hidden")
    {
        div.expanded = "expanded";
        jQuery(div).addClass("expanded");
        jQuery("#" + div.id + "-content").css("display", "block");
    }


}

PolicyFeed.doExpandDocument = function(data, status)
{
    var div_id = "doc-" + data.id;
    var div = document.getElementById(div_id);

    div.expanded = "expanded";
    jQuery(div).addClass("expanded");
    jQuery(div).append(
        '<div id="' + div_id + '-content" class="content">'
        + '<div class="html">' + data.html + '</div>'
        + '<div class="links">'
            + '<a class="collapse" href="#' + div_id + '" onClick="PolicyFeed.collapseDocument(\'' + div_id + '\')">Suskleisti&uarr;</a>'
            + '<span class="source">Šaltinis: <a href="' + data.meta.url + '">' + data.meta.url + '</a></span>'
        + '</div>'
        + '</div>');
}


PolicyFeed.collapseDocument = function(id)
{
    var div = document.getElementById(id);
    div.expanded = "hidden";
    jQuery(div).removeClass("expanded");
    jQuery("#" + div.id + "-content").css("display", "none");
}

