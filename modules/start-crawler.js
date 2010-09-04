#!/usr/bin/env ringo

// prepend the web app's directory to the module search path
require.paths.push(module.directory);

// Load additional RingoJS packages:
require("packages").loadPackages(getRepository( require("config").DIRS.packages));

// Add triggers for jsonfs:
var jsonfs = require("ctl/objectfs/json");
var SolrClient = require("PolicyFeed/Solr/Client");
jsonfs.addTrigger("afterWrite", "/docs/", SolrClient.onItemChange);
jsonfs.addTrigger("afterRemove", "/docs/", SolrClient.onItemChange);

// Start Crawler:
var Crawler = require("PolicyFeed/Crawler");
Crawler.init(require("config")["PolicyFeed/Crawler"]);
Crawler.checkUpdates();

