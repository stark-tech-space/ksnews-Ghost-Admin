const _ = require('lodash');
const db = require('../../../data/db');

const doRawAndFlatten = function doRaw(query, transaction = db.knex, flattenFn) {
    return transaction.raw(query).then(function (response) {
        return _.flatten(flattenFn(response));
    });
};

const getTables = function getTables(transaction) {
    return doRawAndFlatten('show tables', transaction, function (response) {
        return _.map(response[0], function (entry) {
            return _.values(entry);
        });
    });
};

const getIndexes = function getIndexes(table, transaction) {
    return doRawAndFlatten('SHOW INDEXES from ' + table, transaction, function (response) {
        return _.map(response[0], 'Key_name');
    });
};

const getColumns = function getColumns(table, transaction) {
    return doRawAndFlatten('SHOW COLUMNS FROM ' + table, transaction, function (response) {
        return _.map(response[0], 'Field');
    });
};

// This function changes the type of posts.html and posts.markdown columns to mediumtext. Due to
// a wrong datatype in schema.js some installations using mysql could have been created using the
// data type text instead of mediumtext.
// For details see: https://github.com/TryGhost/Ghost/issues/1947
const checkPostTable = function checkPostTable(transaction = db.knex) {
    return transaction.raw('SHOW FIELDS FROM posts where Field ="html" OR Field = "markdown"').then(function (response) {
        return _.flatten(_.map(response[0], function (entry) {
            if (entry.Type.toLowerCase() !== 'mediumtext') {
                return (transaction || db.knex).raw('ALTER TABLE posts MODIFY ' + entry.Field + ' MEDIUMTEXT');
            }
        }));
    });
};

module.exports = {
    checkPostTable: checkPostTable,
    getTables: getTables,
    getIndexes: getIndexes,
    getColumns: getColumns
};
