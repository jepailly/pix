const { Serializer, Deserializer } = require('jsonapi-serializer');

module.exports = {

  serialize(snapshots) {
    return new Serializer('snapshot', {
      attributes: ['score', 'createdAt', 'testsFinished', 'user', 'studentCode', 'campaignCode'],
      user: {
        ref: 'id',
        attributes: ['firstName', 'lastName']
      },
      transform(json) {
        const snapshot = Object.assign({}, json);
        snapshot.testsFinished = json.testsFinished && json.testsFinished.toString() || null;
        snapshot.score = json.score && json.score.toString() || null;
        return snapshot;
      }
    }).serialize(snapshots);
  },

  deserialize(json) {
    return new Deserializer({ keyForAttribute: 'camelCase' })
      .deserialize(json)
      .then(((snapshot) => {
        snapshot.studentCode = snapshot.studentCode || '';
        snapshot.campaignCode = snapshot.campaignCode || '';
        snapshot.organization = {
          id: json.data.relationships.organization.data.id
        };
        return snapshot;
      }));
  }

};
