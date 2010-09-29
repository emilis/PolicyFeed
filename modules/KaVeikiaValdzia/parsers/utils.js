
/**
 * This field is needed to prevent this library from inclusion in parser list:
 */
exports.disabled = true;


/**
 *
 */
exports.getDocType = function(type) {
    switch (type) {
        case "Darbotvarkė":
            return "darbotvarke";
        break;

        case "Įstatymo projektas":
        case "Komiteto išvados projektas":
        case "Nutarimo projektas":
        case "Pasiūlymas":
        case "Rezoliucijos projektas":
        case "Statuto projektas":
            return "projektas";
        break;

        case "Dekretas":
        case "Išvados":
        case "Įstatymas":
        case "Komiteto išvada":
        case "Nutarimas":
        case "Pagrindinio komiteto išvada":
        case "Potvarkis":
        case "Rezoliucija":
        case "Sprendimas":
        case "Sutartis":
        case "Teisės departamento išvada":
            return "nutarimas";
        break;

        case "Aiškinamasis raštas":
        case "Informacija":
        case "Informacinis pranešimas":
        case "Komiteto posėdžio protokolo išrašas":
        case "Lydraštis":
        case "Lyginamasis variantas":
        case "Priedas":
        case "Protokolas":
        case "Stenograma":
            return "kita";
        break;

        default:
            return false;
    }
}


/**
 *
 */
exports.getCanonicalLrsUrl = function(url) {
    // get url without empty parameters:
    url = url.split("?");
    url[1] = url[1].split("&").filter(function(param) { return (param.slice(-1) != "=") });
    return url.join("?").replace("http://www3.lrs.lt/pls/inter3/", "http://www.lrs.lt/pls/inter/");
}

