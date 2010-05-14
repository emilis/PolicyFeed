#!/usr/bin/env ringo

// prepend the web app's directory to the module search path
require.paths.unshift(module.directory);

// Load Gluestick framework functions:
require("load.gluestick");

// Main script to start robot
var scheduler = require("ringo/scheduler");
var crawler = loadObject("PolicyFeed/Crawler");
var converter = loadObject("PolicyFeed/Converter");

crawler.schedule_id   = scheduler.setInterval(function () { crawler.crawl()     }, 12 * 60 * 1000);
converter.schedule_id = scheduler.setInterval(function () { converter.convert() }, 6 * 60 * 1000);

