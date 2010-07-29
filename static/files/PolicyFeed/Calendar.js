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


var PolicyFeedCalendar = {};

PolicyFeedCalendar.nextMonth = function(selected)
{
    var d = this.getCurrent();
    var month = d.getMonth();
    if (month < 11)
        d.setMonth(month + 1);
    else
    {
        d.setFullYear(d.getFullYear() + 1);
        d.setMonth(0);
    }

    this.getActiveDays(d, selected);
}

PolicyFeedCalendar.prevMonth = function(selected)
{
    var d = this.getCurrent();
    var month = d.getMonth();
    if (month > 0)
        d.setMonth(month - 1);
    else
    {
        d.setFullYear(d.getFullYear() - 1);
        d.setMonth(11);
    }

    this.getActiveDays(d, selected);
}
/*
PolicyFeedCalendar.nextYear = function()
{
    var d = this.getCurrent();
    d.setFullYear(d.getFullYear() + 1);
    this.getActiveDays(d);
}

PolicyFeedCalendar.prevYear = function()
{
    var d = this.getCurrent();
    d.setFullYear(d.getFullYear() - 1);
    this.getActiveDays(d);
}
*/

/**
 * Returns Date object for the 1st day of month in calendar table head.
 */
PolicyFeedCalendar.getCurrent = function()
{
    var title = $("#calendar .title").text();
    var ym = title.split("-");

    return new Date(ym[0], ym[1] - 1, 1);
}

PolicyFeedCalendar.getActiveDays = function(d, selected)
{

    jQuery.getJSON(WEB_URL + "/",
            {
                call: "PolicyFeed/Calendar:getActiveDays",
                year: d.getFullYear(),
                month: d.getMonth() + 1
                },
            function(data, status) { PolicyFeedCalendar.show(d, selected, data) } );
}

PolicyFeedCalendar.show = function(d, selected, active_days)
{
    // set calendar title:
    $("#calendar thead th.title").text(d.getFullYear() + "-" + this.getMonthStr(d));

    selected = selected.replace(/-/g, "/");

    // make active_days a dict:
    var ad = {};
    for (var i in active_days)
        ad[parseInt(active_days[i], 10)] = true;

    // set calendar days:
    var html = "";

    var empty = d.getDay();
    if (empty == 0)
        empty = 6;
    else
        empty--;

    // first week empty cells:
    html +="<tr>";
    for (var i=0; i<empty; i++)
        html += "<td>&nbsp;</td>";

    var today = this.getDatePath(new Date());

    i = 1;
    while (d.getDate() == i)
    {
        var d_path = this.getDatePath(d);

        if (d.getDay() == 1 && i > 1)
            html += '<tr>';

        // add classes to cell:
        var classes = [];
        if (d_path == today)
            classes.push("today");
        if (d_path == selected)
            classes.push("selected");
        html += '<td class="' + classes.join(" ") + '">';

        if (i in ad)
            html += '<a href="' + WEB_URL + '/docs/' + d_path + '/">' + i + '</a>';
        else
            html += i;

        html += '</td>';

        if (d.getDay() == 0)
            html += '</tr>';
        
        i++;
        d.setDate(i);
    }

    // Add empty cells to end of table:
    var empty = d.getDay();
    if (empty != 1)
    {
        if (empty == 0)
            empty = 1;
        else
            empty = 8 - empty;

        for (i=0; i < empty; i++)
            html += '<td>&nbsp;</td>';

        html += '</tr>';
    }

    $("#calendar tbody").html(html);
}

PolicyFeedCalendar.getMonthStr = function(d)
{
    var month = d.getMonth() + 1;
    if (month < 10)
        return "0" + month;
    else
        return "" + month;
}

PolicyFeedCalendar.getDateStr = function(d)
{
    var dd = d.getDate();
    if (dd < 10)
        return "0" + dd;
    else
        return "" + dd;
}

PolicyFeedCalendar.getDatePath= function(d)
{
    return d.getFullYear() + '/' + this.getMonthStr(d) + '/' + this.getDateStr(d);
}




