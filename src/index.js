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
  const configPath = process.env.VERESTRO_CONFIG_PATH || 'verestro.config.json';

  let cert; let key;
  if (certEnv && keyEnv) {
    cert = certEnv;
    key = keyEnv;
  } else if (certPath && keyPath) {
    cert = fs.readFileSync(certPath);
    key = fs.readFileSync(keyPath);
  } else if (fs.existsSync(configPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const v = cfg.verestro || cfg;
      if (v.client) {
        if (v.client.cert && v.client.key) {
          cert = v.client.cert;
          key = v.client.key;
        } else if (v.client.certPath && v.client.keyPath) {
          cert = fs.readFileSync(v.client.certPath);
          key = fs.readFileSync(v.client.keyPath);
        }
      }
    } catch (err) {
      // ignore parse errors and continue
    }
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
    method: options.method || 'GET',
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
    if (options.body) req.write(options.body);
    req.end();
  });
}

/**
 * Send a JSON request (POST by default) to Verestro using mTLS.
 * `jsonObj` will be JSON.stringify'ed. Options forwarded to `connectToVerestro`.
 */
function sendJsonToVerestro(urlStr, jsonObj, options = {}) {
  const body = JSON.stringify(jsonObj);
  const headers = Object.assign({}, options.headers || {}, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });

  return connectToVerestro(urlStr, Object.assign({}, options, { method: options.method || 'POST', body, headers }));
}

module.exports = { greet, connectToVerestro, _loadCertKeyFromEnvOrFiles };
