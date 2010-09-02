
var jsonfs = require("ctl/objectfs/json");
var assert = require("assert");

exports.testPersistCreation = function() {
    var id = "/test";
    var data = { _id: id, title: "Test Data" };

    jsonfs.write(id, data);

    assert.deepEqual(jsonfs.read(id), data);
}
