/*
 * PolicyFeed configuration for website and crawler.
 */

var fs = require("fs");

var ROOT_DIR = fs.absolute(module.directory + "../");

exports.httpConfig = {
    staticDir: ROOT_DIR + '/static/'
};

exports.urls = [
    // docs:
    [ /(docs\/\d\d\d\d\/\d\d\/\d\d\/\d+)\.(json)/,  "PolicyFeed", "showDocumentFormat" ],
    [ /(docs\/\d\d\d\d\/\d\d\/\d\d\/\d+)/,          "PolicyFeed", "showDocument" ],
    [ /docs\/(\d\d\d\d\/\d\d\/\d\d)/,               "PolicyFeed", "showDay" ],
    [ /docs\/(\d\d\d\d\/\d\d)/,                     "PolicyFeed", "showMonth" ],
    [ /docs\/(\d\d\d\d)/,                           "PolicyFeed", "showYear" ],

    [ /docs\/search/,           "PolicyFeed", "search" ],
    [ /docs\/rss/,              "PolicyFeed", "showRss" ],
    [ /docs\/?$/,               "PolicyFeed", "showDocumentList" ],

    // static pages:
    [ /pages\/(.+)/,            "KaVeikiaValdzia/Site", "showPage" ],

    // Default mapping by request parameters. See: ctl/WebMapper.mapRequest().
    [ /.*/, 'ctl/WebMapper'] 
];

/*/ Left over from RingoJS demoapp config.
exports.middleware = [
    require('ringo/middleware/gzip').middleware,
    require('ringo/middleware/etag').middleware,
    require('ringo/middleware/responselog').middleware,
    require('ringo/middleware/error').middleware,
    require('ringo/middleware/notfound').middleware
];
//*/

// the JSGI app
exports.app = require('ringo/webapp').handleRequest;

/*/ Left over from RingoJS demoapp config.
exports.macros = [
    require('./helpers'),
    require('ringo/skin/macros'),
    require('ringo/skin/filters')
];
//*/

exports.charset = 'UTF-8';
exports.contentType = 'text/html';



// --- Gluestick constants: ---

exports.DIRS = {
    root:       ROOT_DIR,
    files:      ROOT_DIR + "/static/files",
    uploads:    ROOT_DIR + "/static/uploads",
    config:     ROOT_DIR + "/config",
    data:       ROOT_DIR + "/data",
    lib:        ROOT_DIR + "/lib",
    packages:   ROOT_DIR + "/lib/packages",
    modules:    ROOT_DIR + "/modules"
};

var base_url = "";
exports.URLS = {
    base:       base_url,
    files:      base_url + "/static/files",
    uploads:    base_url + "/static/uploads"
};


// --- Gluestick interfaces: ---

exports.gluestick = {
    interfaces: {
        DB: {
            module: "ctl/DB/Sqlite",
            config: {
                filename: exports.DATA_DIR + "/default.sqlite3"
            }},
        DB_urls: {
            module: "ctl/DB/Sqlite",
            config: {
                filename: exports.DATA_DIR + "/policyfeed_urls.sqlite3"
            }},
        Events: {
            module: "ctl/Events",
            config: {
                callbacks: [
                    [ /./,                      "ctl/Events/Logger:logEvent" ],
                    [ /(debug|error|warning)/,  "ctl/Events/ShellWriter:printEvent" ]
                ]
            }},
        Site: "KaVeikiaValdzia/Site",
        WebMapper: {
            module: "ctl/WebMapper",
            config: {
                default_call: "Site:showIndex",
                allowed: [
                    "Site",
                    "PolicyFeed",
                    "PolicyFeed/Calendar",
                    "PolicyFeed/Comments"
                ]
            }}
    }
};


// --- Module config: ---

exports["PolicyFeed/Crawler"] = {
    parser_dir: exports.MODULES_DIR + "/KaVeikiaValdzia/Parsers",
    parser_prefix: "KaVeikiaValdzia/Parsers/"
};

exports["PolicyFeed/UrlErrors"] = {
    to: "policyfeed-errors@mailinator.com",
    from: "policyfeed@localhost",
    subject: "PolicyFeed/UrlErrors status"
};

