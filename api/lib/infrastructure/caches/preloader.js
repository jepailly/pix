const airtable = require('../airtable');
const cache = require('./cache');

function cacheIndividually(records, tablename) {
  return Promise.all(records.map((record) => {
    const cacheKey = `${tablename}_${record.id}`;
    return cache.set(cacheKey, record._rawJson);
  }));
}

function loadTable(tableName) {
  return airtable.findRecords(tableName)
    .then((records) => cacheIndividually(records, tableName));
}

module.exports = {

  loadAllTables() {
    return Promise.all([
      'Acquis',
      'Competences',
      'Domaines',
      'Epreuves',
      'Tests',
      'Tutoriels',
    ].map(loadTable));
  },

};
