const packageJSON = require('../../../package.json');
const settings = require('../../../lib/settings');
const Boom = require('boom');
const healthcheckRepository = require('../../infrastructure/repositories/healthcheck-repository');

module.exports = {

  get(request, reply) {

    reply({
      'name': packageJSON.name,
      'version': packageJSON.version,
      'description': packageJSON.description,
      'environment': settings.environment,
      'container-version': process.env.CONTAINER_VERSION,
      'container-app-name': process.env.APP,
    });
  },

  getDbStatus(request, reply) {
    return healthcheckRepository.check()
      .then(() => reply({ message: 'Connection to database ok' }))
      .catch(() => {
        reply(Boom.serverUnavailable('Connection to database failed'));
      });
  },

  crashTest(request, reply) {
    reply(Boom.internal());
  }
};
