/*
    Copyright 2009,2010 Emilis Dambauskas

    This file is part of Cheap Tricks Library for RingoJS.

    Cheap Tricks Library is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Cheap Tricks Library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Cheap Tricks Library.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
    A very simple Embedded JavaScript implementation.

    Template example:

    <html><head>
    <title><%= title %></title>
    </head><body>
    <h1><%= title %></h1>
    <ol><% for (var i=0; i<10; i++) print('<li>item</li>'); %></ol>
    </body></html>

    Usage example:

    tpl = require("modules/ctl/Template");

    // these are equivalent:
    tpl.assign("title", "Hello World!");
    tpl.assign({ title: "Hello World!" });

    var str = tpl.fetch("/path/to/template/file.ejs");

    // you can also pass additional vars to fetch():
    var str = tpl.fetch("/path/to/template/file.ejs", { title: "Hello World!" });
*/



var fs = require("fs");


/**
 * Returns a quoted string that can be used as JavaScript code.
 * Based on http://phpjs.org/functions/addslashes:303
 */
function quote(str)
{
    return "'"
        // escape backslashes and quotes, replace NULL characters and newlines:
        + (""+str).replace(/([\\"'])/g, "\\$1").replace(/\u0000/g, "\\0").replace(/\n/g, "\\u000a")
        + "'";
}


exports.vars = {};


/**
 *
 */
exports.assign = function(name, value)
{
    if (typeof(value) != "undefined")
        this.vars[name] = value;
    else
    {
        for (var key in name)
        {
            if (name.hasOwnProperty(key))
                this.vars[key] = name[key];
        }
    }
}


/**
 *
 */
exports.fetch = function(tpl_file_name, vars)
{
    return this.fetchObject(tpl_file_name, vars, "html")["html"];
}


/**
 * 
 */
exports.fetchObject = function(tpl_file_name, vars, output_var_name) {

    vars = vars || {};

    // Read template file contents:
    if (!fs.exists(tpl_file_name))
        return '<p class="error">ctl/Template.js: template file "' + tpl_file_name + '" not found.</p>';

    if (!output_var_name)
        output_var_name = "html";


    var code = this.compileCode( fs.read(tpl_file_name) );


    // Build vars object:
    if (vars == undefined)
        vars = {};
    for (var key in this.vars)
    {
        if (vars[key] == undefined && this.vars.hasOwnProperty(key))
            vars[key] = this.vars[key];
    }

    vars.config = require("config");
    vars.print = function() { this.__output += Array.prototype.slice.call(arguments).join(""); }
    vars.__output = "";
    vars.returnVar = function(name, value) { this.__return[name] = value; };
    vars.__return = {};

    // Evaluate code:
    try
    {
        with (vars) { eval(code); }
    }
    catch (error)
    {
        print(uneval(error));
        vars.__return[output_var_name] = '<p class="error">There was an error processing template file "' + tpl_file_name + '".</p>';
        return vars.__return;
    }

    vars.__return[output_var_name] = vars.__output;

    return vars.__return;
}


exports.compileCode = function(str)
{
    // Create code block:
    var code = "";
    var b_start = 0;
    var b_end = 0;
    var print_block = false;

    while (str.length > 0)
    {
        if ( (b_start = str.indexOf('<%')) < 0)
        {
            // End of processing:
            code += "print(" + quote(str) + ");\n";
            str = "";
        }
        else
        {
            // <% / <%=
            code += "print(" + quote(str.substr(0, b_start)) + ");\n";

            str = str.substr(b_start + 2);
            if (str[0] == "=")
            {
                code += "print(";
                str = str.substr(1);
                print_block = true;
            }
            else
                print_block = false;

            // %>
            b_end = str.indexOf('%>');
            
            // In this case it will end processing after this step:
            if (b_end < 0)
                b_end = str.length;

            code += str.substr(0, b_end);

            if (print_block)
                code += ");\n";
            
            str = str.substr(b_end + 2);
        }
    }

    return code;
}

