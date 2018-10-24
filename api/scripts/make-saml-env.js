const fs = require('fs');

function readXml(filename) {
  return fs.readFileSync(filename, 'utf-8').replace(/^\s+|\s+$|\n/gm, '');
}

console.log(`SAML_SP_CONFIG=${JSON.stringify({
  metadata: readXml('metadata_sp.xml'),
  encPrivateKey: fs.readFileSync('./privatekey.pem', 'utf-8'),
})}`);

console.log(`SAML_IDP_CONFIG=${JSON.stringify({
  metadata: readXml('metadata_idp.xml'),
  isAssertionEncrypted: true,
  messageSigningOrder: 'encrypt-then-sign',
})}`);
