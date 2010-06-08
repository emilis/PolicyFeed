#!/usr/bin/env ringo

// prepend the web app's directory to the module search path
require.paths.push(module.directory);

// Load Gluestick framework functions:
require("load-gluestick");

// Load additional RingoJS packages:
require("packages").loadPackages(getRepository( require("config").PACKAGES_DIR ));

var slist = require("PolicyFeed/SourceList");
slist.init(require("config").PolicyFeed.SourceList);
slist.checkUpdates();

