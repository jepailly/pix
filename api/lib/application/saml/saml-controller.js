const saml = require('samlify');

function tryParseJSON(maybeJson) {
  try {
    return JSON.parse(maybeJson);
  } catch(e) {
    return undefined;
  }
}

let _serviceProvider, _identityProvider;

function _getServiceProvider() {
  const spConfig = tryParseJSON(process.env.SAML_SP_CONFIG);
  if (!_serviceProvider) {
    _serviceProvider = spConfig && saml.ServiceProvider(Object.assign({}, spConfig));
  }
  return _serviceProvider;
}

function _getIdentityProvider() {
  const idpConfig = tryParseJSON(process.env.SAML_IDP_CONFIG);
  if (!_identityProvider) {
    _identityProvider = idpConfig && saml.IdentityProvider(idpConfig);
  }
  return _identityProvider;
}

module.exports = {

  metadata(request, reply) {
    return reply(_getServiceProvider().entitySetting.metadata).type('application/xml');
  },

  login(request, reply) {
    const { context } = _getServiceProvider().createLoginRequest(_getIdentityProvider(), 'redirect');
    return reply.redirect(context);
  },

  async assert(request, reply) {
    try {
      const parseResult = await _getServiceProvider().parseLoginResponse(
        _getIdentityProvider(),
        'post',
        { body: request.payload }
      );

      return reply(`Bienvenue, ${parseResult.extract.attributes['urn:oid:2.16.840.1.113730.3.1.241']}`);
    } catch(e) {
      return reply(e.toString()).code(400);
    }
  },

};
