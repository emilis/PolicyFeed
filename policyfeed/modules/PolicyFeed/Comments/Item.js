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

exports.extendObject("ctl/DataObject/DbRow");
exports.extendObject("ctl/DataObject/Validatable");

exports._tableName = "comments";

exports._children = [];

exports.addChild = function(child)
{
    if (this.id != child.id)
        this._children.push(child);
}

exports.prepareText = function(str)
{
    return "<p>" + str.trim().replace(
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

exports.toHtml = function()
{
    var html = '<li id="' + this.id + '" class="comment">'
        + '<div class="properties">'
            + '<a class="upvote">+</a>'
            + ' <a class="score">1</a>'
            + ' <span class="name">' + this.author + '</span>'
            + ' <span class="time">' + this.updated.substr(0,16) + '</span>'
            + ' <a class="report">&times;</a>'
            + '</div>'
        + '<div class="text">' + this.prepareText(this.text) + '</div>'
        + '<div class="footer"><a href="#comment-form" class="reply">atsakyti</a></div>';

    if (this._children.length > 0)
    {
        html += '<ol>';
        for (var i=0; i<this._children.length; i++)
            html += this._children[i].toHtml() + "\n";
        html += '</ol>';
    }

    html += '</li>';

    return html;
}


exports.parent_insert = exports.insert;

exports.insert = function()
{
    if (!this.parent_insert())
        return false;
    else
    {
        var thread = this.thread_id.split("/");
        if (thread[0] == "docs")
        {
            var doc = newObject("PolicyFeed/Document");
            return doc.commentAdded(thread[1]);
        }
    }
}

/*
exports._errors = {};
exports._errors_found = false;

exports.addError = function(field, value)
{
    this._errors_found = true;
    this._errors[field] = value;
}

exports.validate = function()
{
    this._errors = {};
    this._errors_found = false;

    if (!this.author)
        this.addError("author", "Prašome įvesti vardą.");
    if (!this.text)
        this.addError("text", "Prašome įvesti komentaro tekstą.");
    /*
    if (!this.email)
        this.addError("email", "Prašome įvesti apsaugos tekstą.");
    else if (this.email.indexOf('@') > 0)
        this.addError("spam", true);
    else if (this.email != this.author)
        this.addError("email", "Padarėte klaidą įvesdami apsaugos tekstą.");
    //* /

    print(uneval(this._errors));

    return !this._errors_found;
}
*/

exports.validate_author = function()
{
    if (!this.author)
        return "Prašome įvesti vardą.";
}

exports.validate_text = function()
{
    if (!this.text)
        return "Prašome įvesti komentaro tekstą.";
}
