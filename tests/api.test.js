import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../api/index.js';

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  });
});

test('search rejects a missing query', async () => {
  const response = await fetch(`${baseUrl}/api/search`);
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /Query/);
});

test('audio rejects a missing song id', async () => {
  const response = await fetch(`${baseUrl}/api/audio`);
  assert.equal(response.status, 400);
});

test('import rejects non-Spotify URLs without requesting them', async () => {
  const response = await fetch(`${baseUrl}/api/import?url=${encodeURIComponent('https://example.com/list')}`);
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /Spotify/);
});
