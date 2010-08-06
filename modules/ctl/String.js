

/**
 *
 */
exports.jreg_replace = function(pattern, replacement, str) {
    if (!(pattern instanceof Array))
        pattern = [pattern];
    if (!(replacement instanceof Array))
        replacement = [replacement];

    print(uneval(pattern), uneval(replacement));

    var p = "";
    var last_replacement = "";
    while (p = pattern.shift()) {
        if (replacement.length)
            last_replacement = replacement.shift();
        str = java.util.regex.Pattern.compile(p).matcher(str).replaceAll(last_replacement);
    }

    return str;
}
