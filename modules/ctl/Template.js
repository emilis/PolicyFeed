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
    A rather simple Embedded JavaScript implementation.

    Simple template example:

        <html><head>
        <title><%= vars.title %></title>
        </head><body>
        <h1><%= vars.title %></h1>
        <div id="content"><%= vars.content %></div>
        </body></html>

    Simple usage example:

        ctlTemplate = require("ctl/Template");
        var str = ctlTemplate.fetch("/path/to/simple/example.ejs", { title: "Ohai", content: "Hello World!" });
        // str now contains the html with title and content inserted.
    
    Advanced template example:

        <%
        var {me} = vars;

        exports.title = "Advanced example by " + me;
        export("author", "A developer called " + me);

        %><ol><%
        for (var i=0; i<11; i++)
            print("<li>" + i + "</li>");

        %></ol>
        <p>This one goes up to 11. <em>Orly?</em></p>

    Advanced usage:

        ctlTemplate = require("ctl/Template");
        var obj = ctlTempalte.fetchObject("/path/to/advanced/example.js", { name: "me" } , "content");
        // Object.keys(obj) == ["title", "author", "content"];
        var str = ctlTemplate.fetch("/path/to/simple/example.ejs", obj);
        // str now contains the combined html of the above two templates.
    
*/

// Requirements:
var fs = require("fs");


/**
 * Processes a template with given vars and returns output as string.
 * @param {String} template Template file name.
 * @param {Object} vars Variables for template.
 * @return Template output.
 * @type String
 */
exports.fetch = function(tpl_file_name, vars) {

    return this.fetchObject(tpl_file_name, vars, "content")["content"];
}


/**
 * Processes a template with given vars and returns output.
 * @param {String} template Template file name.
 * @param {Object} vars Variables for template.
 * @param {String} output_param Property where output will be stored in the result (defaults to "content").
 * @return Result.
 * @type Object
 */
exports.fetchObject = function(tpl_file_name, vars, output_var_name) {

    // Create template function:
    var f = this.fileToFunction( tpl_file_name );

    // Call template function with given vars:
    try {
        return f(vars, output_var_name);
    } catch (error) {
        error.message  = "There was an error processing template '" + tpl_file_name + "': " + error.message;
        throw error;
    }
}


/**
 * Creates a function from given template file.
 * @param {String} file_name
 * @return Function
 * @type Function
 */
exports.fileToFunction = function(tpl_file_name) {
    
    // Check if template file exists:
    if (!fs.exists(tpl_file_name)) {
        throw Error(module.id + ': template file "' + tpl_file_name + '" not found.');
    }

    // Parse file contents:
    try {
        var f = this.codeToFunction( fs.read(tpl_file_name) );
    } catch (error) {
        error.message = "There was an error parsing template file '" + tpl_file_name + "': " + error.message;
        throw error;
    }

    return f;
}


/**
 * Creates a function from given template code.
 * @param {String} code Embedded JavaScript code.
 * @return Function
 * @type Function
 */
exports.codeToFunction = function(str) {

    var prefix = 'vars = vars || {}; \n\
        __output_name = __output_name || "content"; \n\
        var exports = {}; \n\
        var export = function(k, v) { exports[k] = v; }; \n\
        var __output = ""; \n\
        var print = function() { __output += Array.prototype.slice.call(arguments).join(""); }; \n\
        var config = require("config"); \n\
        ';

    var suffix = ';\n\
        exports[__output_name] = __output; \n\
        return exports;';

    return new Function('vars, __output_name', prefix + this.compileCode(str) + suffix);
}


/**
 * Returns a quoted string that can be used as JavaScript code.
 * Based on http://phpjs.org/functions/addslashes:303
 * @param {String} string A string.
 * @return Quoted string.
 * @type String
 */
function quote(str) {
    return "'"
        // escape backslashes and quotes, replace NULL characters and newlines:
        + (""+str).replace(/([\\"'])/g, "\\$1").replace(/\u0000/g, "\\0").replace(/\n/g, "\\u000a")
        + "'";
}



/**
 * Parses embedded JavaScript into normal JavaScript.
 * @param {String} string Embedded code.
 * @return JavaScript code.
 * @type String
 */
exports.compileCode = function(str) {

    // Create code block:
    var code = "";
    var b_start = 0;
    var b_end = 0;
    var print_block = false;

    while (str.length > 0) {
        if ( (b_start = str.indexOf('<%')) < 0) {
            // End of processing:
            code += "print(" + quote(str) + ");\n";
            str = "";
        } else {
            // <% / <%=
            code += "print(" + quote(str.substr(0, b_start)) + ");\n";

            str = str.substr(b_start + 2);
            if (str[0] == "=") {
                code += "print(";
                str = str.substr(1);
                print_block = true;
            } else {
                print_block = false;
            }

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

