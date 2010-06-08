// Run w/, e.g.: $ ringo test/all

include('ringo/unittest');
var dbPath = require('fs').join(module.directory, 'db');
var {Store} = require('ringo/storage/berkeleystore');
var store = new Store(dbPath);
var personId, person;
var Person = store.defineEntity('Person');
const FIRST_NAME_1 = 'Hans';
const FIRST_NAME_2 = 'Herbert';
const LAST_NAME = 'Wurst';
const BIRTH_DATE_MILLIS = 123456789000;
const BIRTH_YEAR = new Date(BIRTH_DATE_MILLIS).getFullYear();
const SSN_1 = 'AT-1234291173';
const SSN_2 = 'AT-4321291173';
const VITAE = 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, ' +
        'sed diam nonumy eirmod tempor invidunt ut labore et dolore magna ' +
        'aliquyam erat, sed diam voluptua. At vero eos et accusam et justo ' +
        'duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata ' +
        'sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, ' +
        'consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ' +
        'ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero ' +
        'eos et accusam et justo duo dolores et ea rebum. Stet clita kasd ' +
        'gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.';

exports.setUp = exports.tearDown = function () {
    for each (let instance in Person.all()) {
        instance.remove(); // Clean up.
    }
};

exports.testPersistCreation = function () {
    person = createTestPerson();
    person.save();
    person = Person.all()[0];
    assertPerson();
    assertEqual(FIRST_NAME_1, person.firstName);
    assertEqual(LAST_NAME, person.lastName);
    assertEqual(new Date(BIRTH_DATE_MILLIS), person.birthDate);
    assertEqual(BIRTH_YEAR, person.birthYear);
    assertEqual(VITAE, person.vitae);
};

exports.testPersistUpdating = function () {
    person = createTestPerson();
    person.save();
    person = Person.all()[0];
    assertPerson();
    personId = person._id;
    person.firstName = FIRST_NAME_2;
    person.save();
    person = Person.get(personId);
    assertPerson();
    assertEqual(FIRST_NAME_2, person.firstName);
    assertEqual(LAST_NAME, person.lastName);
    assertEqual(new Date(BIRTH_DATE_MILLIS), person.birthDate);
    assertEqual(BIRTH_YEAR, person.birthYear);
    assertEqual(VITAE, person.vitae);
};

exports.testPersistDeletion = function () {
    person = createTestPerson();
    person.save();
    person = Person.all()[0];
    assertPerson();
    personId = person._id;
    person.remove();
    person = Person.get(personId);
    assertNull(person);
    assertEqual(0, Person.all().length);
};

exports.testBasicQuerying = function () {
    person = createTestPerson();
    person.save();
    person = createTestPerson();
    person.firstName = FIRST_NAME_2;
    person.ssn = SSN_2;
    person.save();
    assertTrue(Person.all()[0] instanceof Storable &&
            Person.all()[0] instanceof Person);
    assertEqual(2, Person.all().length);
    assertEqual(LAST_NAME, Person.all()[0].lastName);
    var queriedPerson = Person.query().equals('firstName', FIRST_NAME_1).
            select()[0];
    assertTrue(queriedPerson instanceof Storable &&
            queriedPerson instanceof Person);
    assertEqual(1, Person.query().equals('firstName', FIRST_NAME_1).select().
            length);
    assertEqual(FIRST_NAME_1, Person.query().equals('firstName', FIRST_NAME_1).
            select('firstName')[0]);
    assertEqual(2, Person.query().equals('lastName', LAST_NAME).select().
            length);
    assertEqual(SSN_2, Person.query().equals('lastName', LAST_NAME).
            equals('firstName', FIRST_NAME_2).select('ssn')[0]);
    testGreaterLessQuerying();
};

function testGreaterLessQuerying() {
    assertEqual(2, Person.query().greater('birthYear', BIRTH_YEAR - 1).select().
            length);
    assertEqual(0, Person.query().greater('birthYear', BIRTH_YEAR + 1).select().
            length);
    assertEqual(2, Person.query().less('birthYear', BIRTH_YEAR + 1).select().
            length);
    assertEqual(0, Person.query().less('birthYear', BIRTH_YEAR - 1).select().
            length);
    assertEqual(2, Person.query().greaterEquals('birthYear', BIRTH_YEAR).
            select().length);
    assertEqual(2, Person.query().greaterEquals('birthYear', BIRTH_YEAR - 1).
            select().length);
    assertEqual(0, Person.query().greaterEquals('birthYear', BIRTH_YEAR + 1).
            select().length);
    assertEqual(2, Person.query().lessEquals('birthYear', BIRTH_YEAR).select().
            length);
    assertEqual(2, Person.query().lessEquals('birthYear', BIRTH_YEAR + 1).
            select().length);
    assertEqual(0, Person.query().lessEquals('birthYear', BIRTH_YEAR - 1).
            select().length);
    assertEqual(2, Person.query().greater('birthDate', new Date(
            BIRTH_DATE_MILLIS - 1000)).select().length);
    assertEqual(0, Person.query().greater('birthDate', new Date(
            BIRTH_DATE_MILLIS)).select().length);
    assertEqual(2, Person.query().less('birthDate', new Date(BIRTH_DATE_MILLIS +
            1000)).select().length);
    assertEqual(0, Person.query().less('birthDate', new Date(BIRTH_DATE_MILLIS)
            ).select().length);
    assertEqual(2, Person.query().greaterEquals('birthDate', new Date(
            BIRTH_DATE_MILLIS)).select().length);
    assertEqual(2, Person.query().greaterEquals('birthDate', new Date(
            BIRTH_DATE_MILLIS - 1000)).select().length);
    assertEqual(0, Person.query().greaterEquals('birthDate', new Date(
            BIRTH_DATE_MILLIS + 1000)).select().length);
    assertEqual(2, Person.query().lessEquals('birthDate', new Date(
            BIRTH_DATE_MILLIS)).select().length);
    assertEqual(2, Person.query().lessEquals('birthDate', new Date(
            BIRTH_DATE_MILLIS + 1000)).select().length);
    assertEqual(0, Person.query().lessEquals('birthDate', new Date(
            BIRTH_DATE_MILLIS - 1000)).select().length);
    assertEqual(LAST_NAME, Person.query().equals('lastName', LAST_NAME).
            greater('birthDate', new Date(BIRTH_DATE_MILLIS - 1000)).
            less('birthYear', BIRTH_YEAR + 1).select('lastName')[0]);
}

function createTestPerson() {
    return new Person({firstName: FIRST_NAME_1, lastName: LAST_NAME,
            birthDate: new Date(BIRTH_DATE_MILLIS), birthYear: BIRTH_YEAR,
            ssn: SSN_1, vitae: VITAE});
}

function assertPerson() {
    assertNotNull(person);
    assertTrue(person instanceof Storable &&
            person instanceof Person);
}

if (require.main == module.id) {
    require('ringo/unittest').run(exports);
}
