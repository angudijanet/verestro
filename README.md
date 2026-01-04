# verestro

Test app fro connectign to Verestro

Author: Janet Angudi

## Quickstart

Install dependencies and run tests:

```bash
npm install
npm test
```

## Connecting to Verestro with TLS client certificate

Verestro requires an SSL client certificate and private key. The app supports two ways to provide them:

- Files: set `CLIENT_CERT_PATH` and `CLIENT_KEY_PATH` environment variables to the PEM file paths.
- Environment variables: set `CLIENT_CERT` and `CLIENT_KEY` to the PEM content (for CI use with secrets).

Example (local files):

```bash
export VERESTRO_URL="https://verestro.example.com/api" \
	CLIENT_CERT_PATH="/path/to/client.crt" \
	CLIENT_KEY_PATH="/path/to/client.key"

node -e "require('./src').connectToVerestro(process.env.VERESTRO_URL).then(r=>console.log(r.statusCode)).catch(e=>console.error(e))"
```

Example (CI with GitHub Secrets): set `CLIENT_CERT` and `CLIENT_KEY` secrets (contents of PEM files), then configure the workflow to export them as env vars for the job.

