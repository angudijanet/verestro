const fs = require('fs');
const https = require('https');
const { URL } = require('url');

function greet(name) {
  return `Hello, ${name || 'world'}`;
}

function _loadCertKeyFromEnvOrFiles() {
  const certPath = process.env.CLIENT_CERT_PATH;
  const keyPath = process.env.CLIENT_KEY_PATH;
  const certEnv = process.env.CLIENT_CERT;
  const keyEnv = process.env.CLIENT_KEY;

  let cert; let key;
  if (certEnv && keyEnv) {
    cert = certEnv;
    key = keyEnv;
  } else if (certPath && keyPath) {
    cert = fs.readFileSync(certPath);
    key = fs.readFileSync(keyPath);
  } else {
    return null;
  }

  return { cert, key };
}

/**
 * Connect to the given URL using mutual TLS (client cert/key).
 * Options:
 *  - certAndKey: { cert, key } (Buffer|string)
 *  - rejectUnauthorized: boolean (default true)
 */
function connectToVerestro(urlStr, options = {}) {
  const url = new URL(urlStr);
  const provided = options.certAndKey || _loadCertKeyFromEnvOrFiles();
  if (!provided) {
    return Promise.reject(new Error('client certificate and key not provided'));
  }

  const requestOptions = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname + url.search,
    method: 'GET',
    cert: provided.cert,
    key: provided.key,
    rejectUnauthorized: options.rejectUnauthorized !== undefined ? options.rejectUnauthorized : true,
  };

  return new Promise((resolve, reject) => {
    const req = https.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

module.exports = { greet, connectToVerestro, _loadCertKeyFromEnvOrFiles };
