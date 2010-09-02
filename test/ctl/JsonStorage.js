
var JsonStorage = require("ctl/JsonStorage");
var assert = require("assert");

exports.testPersistCreation = function() {
    var id = "/test";
    var data = { _id: id, title: "Test Data" };

    JsonStorage.write(id, data);

    assert.deepEqual(JsonStorage.read(id), data);
}
