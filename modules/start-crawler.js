#!/usr/bin/env ringo

// prepend the web app's directory to the module search path
require.paths.push(module.directory);

// Load additional RingoJS packages:
require("packages").loadPackages(getRepository( require("config").DIRS.packages));

// Add triggers for jsonfs:
var jsonfs = require("ctl/objectfs/json");
var SolrClient = require("PolicyFeed/Solr/Client");
var DocQueries = require("PolicyFeed/Crawler/DocQueries");

jsonfs.addTrigger("afterWrite", "/docs/", SolrClient.onItemChange);
jsonfs.addTrigger("afterRemove", "/docs/", SolrClient.onItemChange);
jsonfs.addTrigger("afterCreate", "/docs/", DocQueries.runQueries);

// Start Crawler:
var Crawler = require("PolicyFeed/Crawler");
Crawler.init(require("config")["PolicyFeed/Crawler"]);
Crawler.checkUpdates();

// Some vars and functions for easier error handling:
var CrawlerErrors = require("PolicyFeed/Crawler/Errors");
var CrawlerFailures = require("PolicyFeed/Crawler/Failures");

function retryUrl(url) {
    print(url);
    CrawlerErrors.removeUrl(url);
    Crawler.reindexUrl(url);
}

function failUrl(url, reason) {
    reason = reason || "Unknown (manual).".
    CrawlerErrors.removeUrl(url);
    CrawlerFailures.write(false, { url: url, reason: reason });
}

function retryAllUrls() {
    return CrawlerErrors.getUrlStats().map(function(item) {
            try {
                retryUrl(item.url);
                return true;
            } catch (e) {
                print(e);
                return false;
            }
    });
}

