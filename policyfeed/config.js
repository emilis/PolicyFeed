module.shared = true;

exports.httpConfig = {
  staticDir: 'static'
};

exports.urls = [
    // docs:
    [ /docs\/(\d+)\.(json)/,    "modules/PolicyFeed", "showDocumentFormat" ],
    [ /docs\/(\d+)/,            "modules/PolicyFeed", "showDocument" ],
    [ /docs\/bydate/,           "modules/PolicyFeed", "showListByDate" ],
    [ /docs\/search/,           "modules/PolicyFeed", "search" ],
    [ /docs\/?$/,               "modules/PolicyFeed", "showDocumentList" ],

    // cron jobs:
    [ /cron\/crawl/,            "modules/PolicyFeed/Crawler",   "webCrawl" ],
    [ /cron\/convert/,          "modules/PolicyFeed/Converter", "webConvert" ],

    // static pages:
    [ /pages\/(.+)/,            "modules/KaVeikiaValdzia/Site", "showPage" ],

    // Default mapping by request parameters. See: modules/WebMapper mapRequest().
    [ /.*/, 'modules/ctl/WebMapper'] 
];

/*
exports.middleware = [
    //'helma/middleware/etag',
    //'helma/middleware/responselog' //,
    //'helma/middleware/profiler'
    ];
//*/

exports.app = require('ringo/webapp').handleRequest;

/*
exports.macros = [
    'helma/skin/macros',
    'helma/skin/filters'
    ];
*/

exports.charset = 'UTF-8',
exports.contentType = 'text/html'


// --- Gluestick constants: ---

var WEB_DIR = "/home/www/policyfeed/policyfeed";
var WEB_URL = "http://localhost:8080";
exports.WEB_DIR = WEB_DIR;
exports.WEB_URL = WEB_URL;

exports.FILES_DIR = WEB_DIR + "/static/files";
exports.FILES_URL = WEB_URL + "/static/files";
exports.UPLOADS_DIR = WEB_DIR + "/static/uploads";
exports.UPLOADS_URL = WEB_URL + "/static/uploads";

exports.CONFIG_DIR = WEB_DIR + "/config";
exports.DATA_DIR = WEB_DIR + "/data";
exports.LIB_DIR = WEB_DIR + "/lib";
exports.MODULES_DIR = WEB_DIR + "/modules";


// --- Gluestick config: ---

exports.gluestick = {
    interfaces: {
        DB: "ctl/DB/MySQL",
        DB_new: "ctl/DB/MySQL",
        Events: "ctl/Events",
        Site: "KaVeikiaValdzia/Site",
        WebMapper: "ctl/WebMapper"
    }
};

// --- Interface config: ---

exports.DB = {
    host: "localhost",
    db_name: "policyfeed",
    user: "root",
    password: "",
    useUnicode: "yes",
    characterEncoding: "UTF-8"
};

exports.Events = {
    callbacks: [
        [ /./,                                  "ctl/Events/Logger:logEvent" ],
        [ /(error|warning)/,                    "ctl/Events/ShellWriter:printEvent" ]
    ]
};


exports.WebMapper = {
    default_call: "Site:showIndex",
    allowed: [
        "Site",
        "PolicyFeed",
        "PolicyFeed/Calendar",
        "PolicyFeed/Comments"
    ]
};


// --- Module config: ---

