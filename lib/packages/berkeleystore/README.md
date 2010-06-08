This is a backend for the RingoJS Storable interface based on the Oracle
(formerly Sleepycat) [Berkeley DB Java Edition][1].

  [1]: http://www.oracle.com/database/berkeley-db/je/index.html

Requirements
============

It is written against version 4.6 of Berkeley DB Java Edition.

There is also a version of Berkeleystore that uses the native version of
Berkeley DB in the native-edition branch at
<http://github.com/hns/berkeleystore/tree/native-edition>

Features
========

Like the filestore backend, berkeleystore uses JSON as persistent object format.
Berkeleystore currently has limited query support. All object properties except
for long texts and nested objects but including references and arrays are
automatically indexed so most queries should be pretty efficient.

Functionality
=============

Initializing the store:

    include('ringo/storage/berkeleystore');
    store = new Store(dbpath);

Creating a new Storable class:

    Book = store.defineEntity('book');

Creating and saving a new Storable instance:

    var b = new Book({title: "DBs for dummies"});
    b.save();

Retrieving all objects from a db:

    var books = Book.all();

Retrieving an object by id:

    var book = Book.get(id);

Deleting an object from the db:

    book.remove();

Running a query on the database:

    Book.query().equals('prop', value).select();

The Query.select() method takes an optional argument to retrieve
just a property rather than the whole object, e.g. '_id' or 'title'.

