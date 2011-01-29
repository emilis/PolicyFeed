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
    [ /(docs\/\d\d\d\d\/\d\d\/\d\d\/\d+)\.(json|html)/,  "PolicyFeed", "showDocumentFormat" ],
    [ /(docs\/\d\d\d\d\/\d\d\/\d\d\/\d+)/,          "PolicyFeed", "showDocument" ],
    [ /docs\/(\d\d\d\d\/\d\d\/\d\d)/,               "PolicyFeed", "showDay" ],
    [ /docs\/(\d\d\d\d\/\d\d)/,                     "PolicyFeed", "showMonth" ],
    [ /docs\/(\d\d\d\d)/,                           "PolicyFeed", "showYear" ],

    [ /docs\/search/,           "PolicyFeed", "search" ],
    [ /docs\/rss/,              "PolicyFeed", "showRss" ],
    [ /docs\/?$/,               "PolicyFeed", "showDocumentList" ],

    // static pages:
    [ /pages\/(.+)/,    createRequestHandler("Site", "showPage") ],

    // Default mapping by request parameters. See: ctl/WebMapper.mapRequest().
    [ /.*/,             createRequestHandler("WebMapper", "mapRequest") ] 
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


/**
 * Email where your visitors should send their problems:
 */
exports.supportEmail = "policyfeed@mailinator.com";

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
    full:       "http://localhost:8080" + base_url,
    files:      base_url + "/static/files",
    uploads:    base_url + "/static/uploads"
};


// --- Gluestick interfaces: ---

exports.gluestick = {
    interfaces: {
        DB: {
            module: "ctl/DB/Sqlite",
            clone: true,
            config: { filename: exports.DIRS.data + "/default.sqlite3" }
        },
        DB_alerts: {
            module: "ctl/DB/Sqlite",
            clone: true,
            config: { filename: exports.DIRS.data + "/alerts.sqlite3" }
        },
        DB_queries: {
            module: "ctl/DB/Sqlite",
            clone: true,
            config: { filename: exports.DIRS.data + "/queries.sqlite3" }
        },
        DB_tags: {
            module: "ctl/DB/Sqlite",
            clone: true,
            config: { filename: exports.DIRS.data + "/tags.sqlite3" }
        },
        DB_urls: {
            module: "ctl/DB/Sqlite",
            clone: true,
            config: { filename: exports.DIRS.data + "/urls.sqlite3" }
        },
        DB_users: {
            module: "ctl/DB/Sqlite",
            clone: true,
            config: { filename: exports.DIRS.data + "/users.sqlite3" }
        },
        DB_failures: {
            module: "ctl/DB/Sqlite",
            clone: true,
            config: { filename: exports.DIRS.data + "/failures.sqlite3" }
        },
        Events: {
            module: "ctl/Events",
            config: {
                callbacks: [
                    [ /(debug|error|warning)/,  "ctl/Events/ShellWriter:printEvent" ]
                ]
            }
        },
        Site: "KaVeikiaValdzia/Site",
        WebMapper: {
            module: "ctl/WebMapper",
            config: {
                default_call: ["Site", "showIndex"],
                allowed: [
                    "Site",
                    "PolicyFeed",
                    "PolicyFeed/Calendar",
                    "PolicyFeed/EmailAuth",
                    //"PolicyFeed/Comments",
                    "PolicyFeed/Users/Preferences",
                    "PolicyFeed/Alerts/Manager"
                ]
            }
        }
    }
};


// --- Module config: ---

/**
 * Crawler configuration.
 * "Parsers" are modules that control what websites you index and how.
 */
exports["PolicyFeed/Crawler"] = {
    parser_dir: exports.DIRS.modules + "/KaVeikiaValdzia/parsers",
    parser_prefix: "KaVeikiaValdzia/parsers/"
};

/**
 * Email sending configuration.
 */
exports.mail = {
    to: "policyfeed@mailinator.com", // go to http://policyfeed.mailinator.com/ to get your email :-)
    from: "policyfeed@localhost"
    // If you use Gmail account to send email, this may be helpful:
    //host: "smtp.gmail.com",
    //port: 587,
    //encrypt: true,
    //username: "user@example.org",
    //password: "example-password"
};


/**
 * Settings for reporting Crawler errors:
 */
exports["PolicyFeed/Crawler/Errors"] = {
    message: {
        subject: "PolicyFeed/Crawler/Errors report"
    }
};

/**
 *
 */
exports["PolicyFeed/Crawler/DocQueries"] = {
    handlers: [
        "PolicyFeed/Alerts",
        "KaVeikiaValdzia/tags/organizations",
        "KaVeikiaValdzia/tags/people",
        "KaVeikiaValdzia/tags/laws"
    ]
};

exports["ctl/objectfs/json"] = {
    file_dir: exports.DIRS.data + "/jsonfs"
};

exports["ctl/objectfs/solr"] = {
    url: "http://localhost:8081/solr"
};


//----------------------------------------------------------------------------


function createRequestHandler(mod_name, func_name) {
    var module = false;
    return function() {
        if (!module)
            module = require("gluestick").loadModule(mod_name);
        return module[func_name].apply(module, arguments);
    }
}
