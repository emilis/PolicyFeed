if (typeof(loadObject) == "undefined")
{
    // Create global Gluestick framework functions:
    var gs = require("gluestick");
    Object.defineProperty(Object.prototype, "loadObject",       { value: gs.loadObject });
    Object.defineProperty(Object.prototype, "newObject",        { value: gs.newObject });
    Object.defineProperty(Object.prototype, "extendObject",     { value: gs.extendObject });
    Object.defineProperty(Object.prototype, "getObjectConfig",  { value: gs.getObjectConfig });
}

