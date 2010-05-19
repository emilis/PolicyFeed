#!/usr/bin/env ringo

// prepend the web app's directory to the module search path
require.paths.push(module.directory);

// Load Gluestick framework functions:
require("load-gluestick");

// Main script to start application
if (require.main == module)
{
    require("ringo/webapp").main(module.directory);
}
