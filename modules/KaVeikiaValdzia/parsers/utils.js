
var TypeMap = require("KaVeikiaValdzia/TypeMap");


/**
 * This field is needed to prevent this library from inclusion in parser list:
 */
exports.disabled = true;


/**
 *
 */
exports.getDocType = function(type) {
    return TypeMap.getMap()[type] || false;
}


/**
 *
 */
exports.getCanonicalLrsUrl = function(url) {
    // get url without empty parameters:
    url = url.split("?");
    url[1] = url[1].split("&").filter(function(param) { return (param.slice(-1) != "=") });
    url[1] = url[1].join("&");
    url = url.join("?")
        .replace("http://www3.lrs.lt/pls/inter3/", "http://www.lrs.lt/pls/inter/")
        .replace("http://www3.lrs.lt/pls/inter/", "http://www.lrs.lt/pls/inter/");
    return url;
}

