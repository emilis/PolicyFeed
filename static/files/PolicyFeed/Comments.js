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


var PolicyFeedComments = {};

PolicyFeedComments.thread_id = false;


/**
 *
 */
PolicyFeedComments.init = function(thread_id)
{
    this.thread_id = thread_id;
    jQuery("li.comment > div.footer").show();
    jQuery("li.comment > div.footer a.reply").click(function (evt) { return PolicyFeedComments.reply(evt.target); });
    jQuery("#comment-list").append('<li class="comment">' + this.showForm(0, true) + '</li>');

}


/**
 *
 */
PolicyFeedComments.reply = function(link)
{
    var parent_id = link.parentNode.parentNode.id;
    var form_id = "cf-" + parent_id;
    
    if (!document.getElementById(form_id))
    {
        //todo: check if ol is really <OL>.
        var ol = link.parentNode.nextSibling;
        if (!ol)
        {
            ol = document.createElement('ol');
            // add new <ol> to li:
            link.parentNode.parentNode.appendChild(ol);
        }
        jQuery(ol).append(this.showForm(parent_id));
    }

    $("#" + form_id + ' input').each(function() { this.focus() });
    document.getElementById(form_id).elements.author.focus();

    return false;
}


/**
 *
 */
PolicyFeedComments.showForm = function(parent_id, hide_hide_link)
{
    return '<form id="cf-' + parent_id + '" class="comment-form" method="post" action="' + WEB_URL + '/comments/new" onSubmit="PolicyFeedComments.submitForm(this);return false;">'
        + '<input type="hidden" name="thread_id" value="' + this.thread_id + '">'
        + '<input type="hidden" name="parent_id" value="' + parent_id + '">'
        + 'Vardas: <input name="author"><br>'
        + '<textarea name="text"></textarea><br>'
        //+ '<span id="comment-captcha">Dėl apsaugos nuo robotų įveskite savo vardą dar kartą: <input name="email"></span>'
        + '<input type="submit" value="Komentuoti">'
        + (hide_hide_link ? "" : ' <a class="hide" href="#' + parent_id + '" onClick="return PolicyFeedComments.hideForm(this)">Paslėpti formą.</a>')
        + '</form>';
}


/**
 *
 */
PolicyFeedComments.hideForm = function(link)
{
    var form = link.parentNode;
    jQuery(form).replaceWith("");
    return false;
}


/**
 *
 */
PolicyFeedComments.showReplyLink = function(parent_id)
{
    return '<a class="reply" href="#' + parent_id + '" onClick="return PolicyFeedComments.reply(this)">atsakyti</a>';
}



/**
 *
 */
PolicyFeedComments.submitForm = function(form)
{
    var el = form.elements;

    jQuery(form).fadeTo("normal", 0.33);

    jQuery.post(WEB_URL + "/",
        {
            call: "PolicyFeed/Comments:submitComment",
            thread_id: el.thread_id.value ? el.thread_id.value : this.thread_id,
            parent_id: el.parent_id.value,
            author: el.author.value,
            text: el.text.value
        },
        function (data, textStatus) { return PolicyFeedComments.onSaveComment(data, textStatus, form) },
        "json");

    return false;
}


/**
 *
 */
PolicyFeedComments.onSaveComment = function(data, textStatus, form)
{
    if (textStatus == "success")
    {
        if (!data._errors_found)
        {
            jQuery(form).replaceWith(this.commentDataToHtml(data));
            jQuery("#" + data.id).fadeTo(1, 0.33);
            jQuery("#" + data.id).fadeTo("slow", 1);
        }
        else
        {
            jQuery(form.elements.name).prepend(data._errors.name);
            jQuery(form.elements.text).prepend(data._errors.text);
        }
    }
    else
        //todo: more friendly error handling.
        alert('Nepavyko išsaugoti komentaro arba parsiųsti jo iš serverio. Atsiprašome. Pabandykite perkrauti puslapį.');
}


/**
 *
 */
PolicyFeedComments.prepareText = function(str)
{
    return "<p>" + str.replace(
            /([a-z_][a-z0-9._+]*@[a-z0-9][-a-z0-9.]+[-a-z0-9]+)/ig,
            '<a href="mailto:$1">$1</a>'
        ).replace(
            /(https?:\/\/[^ ]+)/g,
            '<a href="$1">$1</a>'
        ).replace(
            /\n\n+/g,
            "</p><p>"
        ).replace(
            /\n/g,
            "<br/>") + "</p>";
}


/**
 *
 */
PolicyFeedComments.commentDataToHtml = function(comment)
{
    if (!comment.updated)
    {
        var d = new Date();
        comment.updated = d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes();
    }

    return '<li id="' + comment.id + '" class="comment">'
        + '<div class="properties">'
            + '<a class="upvote">+</a>'
            + ' <a class="score">1</a>'
            + ' <span class="name">' + comment.author + '</span>'
            + ' <span class="time">' + comment.updated.substr(0,16) + '</span>'
            + ' <a class="report">&times;</a>'
            + '</div>'
        + '<div class="text">' + this.prepareText(comment.text) + '</div>'
        + '<div class="footer"><a href="#comment-form" class="reply" onClick="return PolicyFeedComments.reply(this)">atsakyti</a></div>';
        + '</li>';
}


