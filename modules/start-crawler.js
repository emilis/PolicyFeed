#!/usr/bin/env ringo

// prepend the web app's directory to the module search path
require.paths.push(module.directory);

// Load additional RingoJS packages:
require("packages").loadPackages(getRepository( require("config").DIRS.packages));

// Add triggers for JsonStorage:
var JsonStorage = require("ctl/JsonStorage");
var SolrClient = require("PolicyFeed/Solr/Client");
JsonStorage.addTrigger("after-write", "/docs/", SolrClient.onItemChange);
JsonStorage.addTrigger("after-remove", "/docs/", SolrClient.onItemChange);

// Start Crawler:
var Crawler = require("PolicyFeed/Crawler");
Crawler.init(require("config")["PolicyFeed/Crawler"]);
Crawler.checkUpdates();

