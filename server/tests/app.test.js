const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');

delete process.env.DATABASE_URL;

const app = require('../app');

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test('health reports unavailable when the database is not configured', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.status, 'error');
  assert.equal(body.database, 'unavailable');
});

test('protected routes reject requests without a Bearer token', async () => {
  const response = await fetch(`${baseUrl}/api/tasks`);
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.match(body.message, /token required/i);
});

test('malformed JSON receives a JSON 400 response', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{invalid-json'
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.match(body.message, /valid JSON/i);
});

test('unknown API routes return a JSON 404 response', async () => {
  const response = await fetch(`${baseUrl}/api/not-a-route`);
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.message, 'API route not found.');
});
