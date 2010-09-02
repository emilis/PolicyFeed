
exports.testAssert = require("./assert");
exports.testConfig = require("./config");
exports.testCtlJsonStorage = require("./ctl/JsonStorage");

// start the test runner if we're called directly from command line
if (require.main == module.id) {
    require("test").run(exports);
}
