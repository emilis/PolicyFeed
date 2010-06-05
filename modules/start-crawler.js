#!/usr/bin/env ringo

// prepend the web app's directory to the module search path
require.paths.push(module.directory);

// Load Gluestick framework functions:
require("load-gluestick");

var slist = require("PolicyFeed/SourceList");
slist.init(require("config").PolicyFeed.SourceList);
slist.checkUpdates();

