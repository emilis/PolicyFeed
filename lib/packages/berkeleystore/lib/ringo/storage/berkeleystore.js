var OBJECT = require('ringo/utils/objects');
include('ringo/engine');
include('ringo/functional');
include('./storeutils');

var log = require('ringo/logging').getLogger(module.id);
module.shared = true;

importPackage(com.sleepycat.je);
importPackage(com.sleepycat.bind.tuple);
importClass(com.sleepycat.collections.CurrentTransaction);

export("Store", "Transaction");
addHostObject(org.ringojs.wrappers.Storable);

var ALLOW_CREATE = true;
var SUCCESS = OperationStatus.SUCCESS;
var READ_UNCOMMITTED = CursorConfig.READ_UNCOMMITTED;

var EQUAL = 0;
var GREATER_THAN = 1;
var GREATER_THAN_OR_EQUAL = 2;
var LESS_THAN = 3;
var LESS_THAN_OR_EQUAL = 4;

function Store(location, options) {

    var self = this;
    var registry = {};

    options = options || {};
    var cacheSize = options.cachesize || 10 * 1024 * 1024;
    var enableTransactions = options.enableTransactions === undefined ?
            true : options.enableTransactions;

    var env = openEnvironment(location);
    var txsupport = CurrentTransaction.getInstance(env);
    var tables = {};
    // var cache = {};

    var proxy = {
        all: all,
        get: get,
        query: query,
        create: create,
        save: save,
        remove: remove,
        getEntity: getEntity,
        getKey: getKey,
        getProperties: getProperties,
        getId: getId,
        equalKeys: equalKeys
    };

    this.defineEntity = function(type) {
        var ctor = registry[type];
        if (!ctor) {
            ctor = registry[type] = Storable.defineEntity(proxy, type);
            ctor.all = bindArguments(all, type);
            ctor.get = bindArguments(get, type);
            ctor.query = bindArguments(query, type);
        }
        return ctor;
    };

    this.beginTransaction = function() {
        return txsupport && txsupport.beginTransaction(null);
    };

    this.getTransaction = function() {
        return txsupport && txsupport.getTransaction();
    };

    this.abortTransaction = function() {
        return txsupport && txsupport.abortTransaction();
    };

    this.commitTransaction = function() {
        return txsupport && txsupport.commitTransaction();
    };

    function create(type, key, entity) {
        var ctor = registry[type];
        if (!ctor) {
            throw new Error("Unknown type: " + type);
        }
        return ctor.createInstance(key, entity);
    }

    function Table(type) {

        var dbname = type + ".db";
        var db, meta, idgen, indexes = {};

        // make sure database table is initialized in transaction
        var tx = enableTransactions ? env.beginTransaction(null, null) : null;
        try {
            db = openDatabase(env, tx, dbname, type);
            meta = openDatabase(env, tx, dbname, type + '_meta');
            idgen = openSequence(meta, tx, type);
            openRegisteredIndexes(tx);
            if (tx) tx.commit();
        } catch(e) {
            if (tx) tx.abort();
            throw e;
        }

        function entryToEntity(id, data) {
            var entity = JSON.parse(entryToString(data));
            Object.defineProperty(entity, "_key", {
                value: createKey(type, id)
            });
            return entity;
        }

        function getStats(database) {
            // var statsconf = new StatsConfig();
            // statsconf.setFast(true);
            return database.getStats(null)
        }

        function openRegisteredIndexes(tx) {
            var data = new DatabaseEntry();
            var result = meta.get(tx, stringToEntry('indexes'), data, null);
            if (result == SUCCESS) {
                var indexarray = JSON.parse(entryToString(data));
                for each (var field in indexarray) {
                    indexes[field] = openIndex(db, tx, dbname, type, field);
                }
            }
        }

        function getIndex(field, create) {
            var index = indexes[field];
            if (!index && create) {
                var indexarray = [field];
                for (var f in indexes) {
                    indexarray.push(f);
                }
                var tx = self.getTransaction();
                var result = meta.put(tx, stringToEntry('indexes'), stringToEntry(JSON.stringify(indexarray)));
                if (result == SUCCESS) {
                    index = indexes[field] = openIndex(db, tx, dbname, type, field);
                }
            }
            return index;
        }

        this.load = function(id) {
            var data = new DatabaseEntry();
            var key = numberToEntry(id);
            if (db.get(null, key, data, null) == SUCCESS) {
                return entryToEntity(id, data);
            } else {
                return null;
            }
        };

        this.store = function(entity) {
            // make sure all indexes used by this object are up
            for (var [name, value] in entity) {
                if (!indexes[name] && isIndexableProperty(name, value)) {
                    getIndex(name, true);
                }
            }
            var id = getId(entity._key);
            // Associate the entity with the database entry so index key creators don't have
            // to parse the JSON. This requires a patched version of berkeley db.
            var dataEntry = stringToEntry(JSON.stringify(entity));
            dataEntry.setEntity(entity);
            db.put(self.getTransaction(), numberToEntry(id), dataEntry);
        };

        this.remove = function(id) {
            db["delete"](self.getTransaction(), numberToEntry(id));
        };

        this.retrieve = function(id) {
            var entity = this.load(id);
            if (entity) {
                return create(type, createKey(type, id), entity);
            }
            return null;
        };

        this.retrieveAll = function() {
            var key = new DatabaseEntry();
            var data = new DatabaseEntry();
            data.setPartial(0, 0, true);
            var cursor = db.openCursor(self.getTransaction(), READ_UNCOMMITTED);
            try {
                var status = cursor.getFirst(key, data, null);
                var list = [];

                while (status === SUCCESS) {
                    list.push(create(type, createKey(type, entryToNumber(key))));
                    status = cursor.getNext(key, data, null);
                }
            } finally {
                tryClose(cursor);
            }
            return list;
        };

        function QueryImpl() {

            var filters = [];

            function getValueFromStorable(value) {
               if (isStorable(value)) {
                    return value._key.$ref;
                } else if (value instanceof Date || value instanceof java.util.Date) {
                    return value.getTime();
                }
                return value;
            }

            function getValueFromEntity(value) {
                if (isKey(value)) {
                    return value.$ref;
                } else if (isStorableDate(value)) {
                    return value.$timestamp;
                }
                return value
            }

            this.addFilter = function(name, operator, value) {

                var comparable = getValueFromStorable(value);
                var key = new DatabaseEntry();
                var pkey = new DatabaseEntry();
                var data = new DatabaseEntry();

                // Try to merge with existing filter
                for (var i = 0; i < filters.length; i++) {
                    if (filters[i].name == name) {
                        filters[i].conditions.push({
                            operator: operator,
                            value: value,
                            comparable: comparable
                        });
                        filters[i].conditions.sort(function(a, b) a.operator - b.operator);
                        return;
                    }
                }

                filters.push({
                    name: name,
                    conditions: [{
                        operator: operator,
                        value: value,
                        comparable: comparable
                    }],
                    isEqualityFilter: function() {
                        return this.conditions[0].operator == EQUAL;
                    },
                    getIndex: function() {
                        return indexes[name];
                    },
                    getWeight: function() {
                        return 0;
                        // get an estimate of the number of enitites selected by this filter
                        if (isNaN(this.weight)) {
                            var index = indexes[name];
                            var count = this.total = index.count();
                            propertyToIndexKey(value, key);
                            switch (this.conditions[0].operator) {
                                case EQUAL:
                                    var cursor = index.openCursor(self.getTransaction(), READ_UNCOMMITTED);
                                    try {
                                        if (this.initCursor(cursor) == SUCCESS) {
                                            this.weight = cursor.count();
                                        } else {
                                            this.weight = 0;
                                        }
                                    } finally {
                                        tryClose(cursor);
                                    }
                                    break;
                                case LESS_THAN:
                                case LESS_THAN_OR_EQUAL:
                                case GREATER_THAN:
                                case GREATER_THAN_OR_EQUAL:
                                    this.weight = (count / 2) / this.conditions.length;
                                    break;
                            }
                            log.debug("Query weight: " + this.weight + " of " + count);
                        }
                        return this.weight;
                    },
                    filterResult: function(previousResult, loadEntities, entitiesLoaded) {
                        if (previousResult && previousResult.count == 0) {
                            return previousResult;
                        } else if (entitiesLoaded) {
                            for (let [id, entity] in previousResult) {
                                if (!this.checkEntity(entity)) {
                                    delete previousResult[id];
                                    previousResult.count -= 1;
                                }
                            }
                            return previousResult;
                        }
                        var result = createResultSet();
                        var index = indexes[name];
                        if (!index) {
                            // non-existing index, return empty result set
                            return result;
                        }
                        if (!loadEntities) {
                            data.setPartial(0, 0, true);
                        }
                        var cursor = index.openCursor(self.getTransaction(), READ_UNCOMMITTED);
                        try {
                            var status = this.initCursor(cursor);
                            if (status != SUCCESS) {
                                return result;
                            }
                            while(status == SUCCESS) {
                                let id = entryToNumber(pkey);
                                if (!previousResult || id in previousResult) {
                                    let s = this.checkProperty(indexKeyToProperty(key));
                                    if (s) {
                                        // store only id or entity at this point, which is relatively cheap.
                                        // we build the actual storable below when we have the final result set.
                                        result[id] = loadEntities ? entryToEntity(id, data) : id;
                                        result.count++;
                                    } else if (s === false) {
                                        break;
                                    }
                                }
                                status = cursor.getNext(key, pkey, data, null);
                            }
                        } finally {
                            tryClose(cursor);
                        }
                        return result;
                    },
                    initCursor: function(cursor) {
                        switch (this.conditions[0].operator) {
                            case EQUAL:
                                propertyToIndexKey(this.conditions[0].value, key);
                                return cursor.getSearchKey(key, pkey, data, null);
                            case GREATER_THAN:
                            case GREATER_THAN_OR_EQUAL:
                                propertyToIndexKey(this.conditions[0].value, key);
                                return cursor.getSearchKeyRange(key, pkey, data, null);
                            default:
                                return cursor.getFirst(key, pkey, data, null);
                        }
                    },
                    /* initCursorBoth: function(cursor, key, pkey, data) {
                        return operator == EQUAL ?
                               cursor.getSearchBoth(key, pkey, data, null) :
                               cursor.getSearchBothRange(key, pkey, data, null);
                    }, */
                    checkEntity: function(entity) {
                        if (entity) {
                            return this.checkProperty(getValueFromEntity(entity[name]));
                        }
                        return false;
                    },
                    checkProperty: function(v) {
                        for each (var condition in this.conditions) {
                            var result;
                            switch (condition.operator) {
                                case EQUAL:
                                    result = v == condition.comparable;
                                    break;
                                case LESS_THAN:
                                    result = v < condition.comparable;
                                    break;
                                case LESS_THAN_OR_EQUAL:
                                    result = v <= condition.comparable;
                                    break;
                                case GREATER_THAN:
                                    if (v == condition.comparable) {
                                        return 0;
                                    }
                                    result = v > condition.comparable;
                                    break;
                                case GREATER_THAN_OR_EQUAL:
                                    result = v >= condition.comparable;
                                    break;
                            }
                            if (!result) return false;
                        }
                        return true;
                    }
                });
            }

            this.select = function(property) {
                // query optimization - sort filters according to the number of matched objects
                filters.sort(function(a, b) {
                    return a.getWeight() - b.getWeight();
                });
                var entitiesLoaded = false,
                    loadEntities = false,
                    countEquals = 0,
                    result;
                while (countEquals < filters.length && filters[countEquals].isEqualityFilter()) {
                    countEquals++;
                }
                if (countEquals > 1 && countEquals == filters.length) {
                    // use native bdb join cursor for multiple equality queries
                    var cursors = [];
                    var joinCursor;
                    try {
                        for each (let filter in filters) {
                            var cursor = filter.getIndex().openCursor(self.getTransaction(), READ_UNCOMMITTED);
                            if (filter.initCursor(cursor) != SUCCESS) {
                                tryClose(joinCursor);
                                for each (let cursor in cursors) {
                                    tryClose(cursor);
                                }
                                return [];
                            }
                            cursors.push(cursor);
                        }
                        joinCursor = db.join(cursors, null);
                        loadEntities = property != '_id';
                        var key = new DatabaseEntry();
                        var data = new DatabaseEntry();
                        if (!loadEntities) {
                            data.setPartial(0, 0, true);
                        }
                        result = createResultSet();
                        while (joinCursor.getNext(key, data, null) == SUCCESS) {
                            let id = entryToNumber(key);
                            result[id] = loadEntities ? entryToEntity(id, data) : id;
                            result.count++;
                        }
                    } finally {
                        tryClose(joinCursor);
                        for each (let cursor in cursors) {
                            tryClose(cursor);
                        }
                    }
                } else {
                    // calculate remaining weight for each filter
                    filters.reduceRight(function(previous, current) {
                        current.remainingWeight = previous;
                        return previous + current.getWeight();
                    }, 0);
                    for (let i = 0; i < filters.length; i++) {
                        let filter = filters[i];
                        // decide if we should load entities
                        if (!entitiesLoaded) {
                            loadEntities =
                                    ((property != null && property != '_id') && i == filters.length - 1)
                                    || filter.weight < filter.remainingWeight / 2
                                    || (result && result.count < filter.remainingWeight / 4);
                            if (loadEntities) {
                                log.debug("Loading entities on stage " + (i + 1) + " of " + filters.length);
                                log.debug("Weight ratio is " + filter.weight + "/" + filter.remainingWeight);
                                entitiesLoaded = true;
                            }
                            result = filter.filterResult(result, loadEntities, false);
                        } else {
                            result = filter.filterResult(result, false, true);
                        }
                    }
                }
                var list = [];
                if (property == '_id') {
                    for (let id in result)
                        list[list.length] = id;
                } else if (property) {
                    for (let [id, value] in result)
                        list[list.length] = create(type, createKey(type, id), value)[property];
                } else {
                    for (let [id, value] in result)
                        list[list.length] = create(type, createKey(type, id), entitiesLoaded ? value : undefined);
                }
                return list;
            };
        }

        function OperatorQuery(parentQuery, operator, name, value) {

            var q = Object.create(BaseQuery.prototype);

            q.select = function(property) {
                return this.getQuery().select(property);
            };

            q.getQuery = function() {
                var query = parentQuery.getQuery();
                query.addFilter(name, operator, value);
                return query;
            };

            return q;
        }

        function BaseQuery() {

            var q = Object.create(BaseQuery.prototype);

            q.select = function(property) {
                var key = new DatabaseEntry();
                var data = new DatabaseEntry();
                if (property == null || property === '_id') {
                    // if we're only interested in ids don't retrieve data
                    data.setPartial(0, 0, true);
                }
                var results = [];
                var cursor = db.openCursor(null, READ_UNCOMMITTED);
                try {
                    while (cursor.getNext(key, data, null) === SUCCESS) {
                        var id = entryToNumber(key);
                        if (property == null) {
                            results.push(create(type, createKey(type, id)));
                        } else if (property === '_id') {
                            results.push(id);
                        } else {
                            var s = create(type, createKey(type, id), entryToEntity(id, data));
                            results.push(property ? s[property] : s);
                        }
                    }
                } finally {
                    tryClose(cursor);
                }
                return results;
            };

            q.getQuery = function() {
                return new QueryImpl();
            };

            return q;
        }

        BaseQuery.prototype.equals = function(name, value) {
            return OperatorQuery(this, EQUAL, name, value);
        };

        BaseQuery.prototype.greater = function(name, value) {
            return OperatorQuery(this, GREATER_THAN, name, value);
        };

        BaseQuery.prototype.greaterEquals = function(name, value) {
            return OperatorQuery(this, GREATER_THAN_OR_EQUAL, name, value);
        };

        BaseQuery.prototype.less = function(name, value) {
            return OperatorQuery(this, LESS_THAN, name, value);
        };

        BaseQuery.prototype.lessEquals = function(name, value) {
            return OperatorQuery(this, LESS_THAN_OR_EQUAL, name, value);
        };

        this.query = BaseQuery;

        this.generateId = function() {
            return idgen.get(self.getTransaction(), 1);
        };

        this.close = function() {
            for (var i in indexes) {
                tryClose(indexes[i]);
            }
            tryClose(idgen);
            tryClose(meta);
            tryClose(db);
        };
    }

    function createResultSet() {
        var result = {};
        Object.defineProperty(result, 'count', {value: 0, writable: true});
        return result;
    }

    function getTable(type) {
        var table = tables[type];
        if (!table) {
            table = tables[type] = new Table(type);
        }
        return table;
    }

    function load(type, id) {
        return getTable(type).load(id);
    }

    function save(props, entity, txn) {
        txn = txn || new BaseTransaction();

        if (updateEntity(props, entity, txn)) {
            var type = getType(entity._key);
            getTable(type).store(entity);
        }
    }

    function query(type) {
        return getTable(type).query();
    }

    function remove(key) {
        var [type, id] = key.$ref.split(":");
        getTable(type).remove(id);
    }

    function get(type, id) {
        return getTable(type).retrieve(id);
    }

    function all(type) {
        return getTable(type).retrieveAll();
    }

    function generateId(type) {
        return getTable(type).generateId();
    }

    function getEntity(type, arg) {
        if (isKey(arg)) {
            var [type, id] = arg.$ref.split(":");
            return load(type, id);
        } else if (isEntity(arg)) {
            return arg;
        } else if (arg instanceof Object) {
            var entity = OBJECT.clone(arg, {});
            Object.defineProperty(entity, "_key", {
                value: createKey(type, generateId(type))
            });
            return entity;
        }
        return null;
    }

    this.close = function() {
        for (var i in tables) {
            tryClose(tables[i]);
        }
        tryClose(env);
        env = null;
        tables = [];
    };

    function openEnvironment(location, options) {
        var envconf = new EnvironmentConfig();
        applyOptions(envconf, options || {
            allowCreate: ALLOW_CREATE,
            cacheSize: cacheSize,
            transactional: enableTransactions
        });
        return new Environment(new java.io.File(location), envconf);
    }

    function openDatabase(env, tx, location, name, options) {
        var dbconf = new DatabaseConfig();
        applyOptions(dbconf, options || {
            allowCreate: ALLOW_CREATE,
            transactional: enableTransactions
        });
        return env.openDatabase(tx, name, dbconf);
    }

    function openIndex(db, tx, location, type, field, options) {
        var dbconf = new SecondaryConfig();
        applyOptions(dbconf, options || {
            allowCreate: ALLOW_CREATE,
            allowPopulate: true,
            transactional: enableTransactions,
            sortedDuplicates: true,
            multiKeyCreator: new SecondaryMultiKeyCreator({
                createSecondaryKeys: function(secondary, primaryKey, primaryData, results) {
                    var obj = primaryData.getEntity();
                    if (!obj) {
                        obj = JSON.parse(entryToString(primaryData));
                        primaryData.setEntity(obj);
                    }
                    var value = obj[field];
                    if (isIndexableProperty(value)) {
                        if (Array.isArray(value)) {
                            for (var i = 0; i < value.length; i++) {
                                if (isIndexableProperty(value[i]) && !Array.isArray(value[i])) {
                                    results.add(propertyToIndexKey(value[i]));
                                }
                            }
                        } else {
                            results.add(propertyToIndexKey(value));
                        }
                    }
                }
            })
        });
        var name = [type, field, 'index'].join('_');
        return db.environment.openSecondaryDatabase(tx, name, db, dbconf);
    }

    function openSequence(db, tx, name, options) {
        var seqconf = new SequenceConfig();
        applyOptions(seqconf, options || {
            allowCreate: ALLOW_CREATE
        });
        return db.openSequence(tx, stringToEntry(name), seqconf);
    }

    java.lang.Runtime.runtime.addShutdownHook(new JavaAdapter(java.lang.Thread, {
        run: function() {
            self.close();
        }
    }));

}

function tryClose(r) {
    try {
        if (r) {
            r.close();
        }
    } catch (error) {
        log.error(error);
    }
}

function equalValues(value1, value2) {
    return value1 === value2 || isKey(value1) && isKey(value2) && equalKeys(value1, value2);
}

function applyOptions(r, options) {
    for (var prop in options) {
        r[prop] = options[prop];
    }
}

function stringToEntry(str, entry) {
   entry = entry || new DatabaseEntry();
   StringBinding.stringToEntry(str, entry);
   return entry;
}

function numberToEntry(num, entry) {
    entry = entry || new DatabaseEntry();
    IntegerBinding.intToEntry(num, entry);
    return entry;
}

var entryToString = StringBinding.entryToString;
var entryToNumber = IntegerBinding.entryToInt;

var TYPE_NULL = 0;
var TYPE_STRING = 1;
var TYPE_NUMBER = 2;
var TYPE_BOOLEAN = 3;
var TYPE_DATE = 4;
var TYPE_REFERENCE = 5;

var MODE_KEY = 0;
var MODE_LOWER_BOUND = -1;
var MODE_UPPER_BOUND = 1;

// Binding to convert object properties to index keys and vice versa
function propertyToIndexKey(value, entry) {
    var output = new TupleOutput();
    if (typeof value == 'string') {
        output.writeByte(TYPE_STRING);
        output.writeString(value);
    } else if (typeof value == 'number') {
        output.writeByte(TYPE_NUMBER);
        output.writeSortedDouble(value);
    } else if (typeof value == 'boolean') {
        output.writeByte(TYPE_BOOLEAN);
        output.writeBoolean(value);
    } else if (isStorableDate(value)) {
        output.writeByte(TYPE_DATE);
        output.writeLong(value.$timestamp);
    } else if (value instanceof Date || value instanceof java.util.Date) {
        output.writeByte(TYPE_DATE);
        output.writeLong(value.getTime());
    } else if (isStorable(value)) {
        output.writeByte(TYPE_REFERENCE);
        output.writeString(value._key.$ref);
    } else if (isKey(value)) {
        output.writeByte(TYPE_REFERENCE);
        output.writeString(value.$ref);
    } else {
        output.writeByte(TYPE_NULL);
    }
    entry = entry || new DatabaseEntry();
    TupleBase.outputToEntry(output, entry);
    return entry;
}

function indexKeyToProperty(entry) {
    var input = TupleBase.entryToInput(entry);
    var proptype = input.readByte();
    switch (proptype) {
        case TYPE_STRING:
            return input.readString();
        case TYPE_NUMBER:
            return input.readSortedDouble();
        case TYPE_BOOLEAN:
            return input.readBoolean();
        case TYPE_DATE:
            return input.readLong();
        case TYPE_REFERENCE:
            return input.readString();
    }
    return null;
}

function isIndexableProperty(value) {
    if (typeof(value) === 'string') {
        return value.length <= 200;
    }
    if (typeof(value) === 'object') {
        return value === null || Array.isArray(value) || isKey(value) || isStorableDate(value);
    }
    return value !== undefined;
}
