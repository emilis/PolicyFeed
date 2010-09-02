
var config = require("config");
var a = require("assert");

var fs = require("fs");

exports.testDirVars = function() {
    a.ok(config.DIRS);
    a.ok(config.DIRS.root);
    a.ok(config.DIRS.config);
    a.ok(config.DIRS.data);
    a.ok(config.DIRS.lib);
    a.ok(config.DIRS.modules);
    a.ok(config.DIRS.packages);
    a.ok(config.DIRS.files);
    a.ok(config.DIRS.uploads);
}

exports.testDirs = function() {
    for each (var dir in config.DIRS) {
        a.isTrue(fs.exists(dir));
    }
}

exports.testUrlVars = function() {
    a.ok(config.URLS);
    a.isNotUndefined(config.URLS.base);
    a.ok(config.URLS.files);
    a.ok(config.URLS.uploads);
}

exports.testGluestickInterfaces = function() {
    a.ok(config.gluestick);
    a.ok(config.gluestick.interfaces);

    var ifaces = config.gluestick.interfaces;
    for (var name in ifaces) {
        a.ok(ifaces[name]);
        if (typeof(ifaces[name]) != "string") {
            a.ok(ifaces[name].module);
        }
    }
}
