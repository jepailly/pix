const metricController = require('./metric-controller');

exports.register = function(server, options, next) {

  server.route([
    {
      method: 'GET',
      path: '/metrics',
      config: {
        auth: false,
        handler: metricController.get,
        tags: ['metrics'] }
    }
  ]);

  return next();
};

exports.register.attributes = {
  name: 'metrics',
  version: '1.0.0'
};
