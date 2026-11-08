import { test, before, after } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import http from 'node:http';

const requests = [];
let core;
let server;
let base;

/**
 * Minimal stand-in for worlddriven/core
 *
 * @param {object} req - The request
 * @param {object} res - The response
 * @return {void}
 */
function coreHandler(req, res) {
  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    const body = Buffer.concat(chunks);
    requests.push({
      method: req.method,
      url: req.url,
      headers: req.headers,
      body,
    });
    const path = req.url.split('?')[0];
    if (path === '/github-callback') {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ sessionId: 'abc', redirect: '/dashboard' }));
    } else if (path === '/install-app') {
      res.writeHead(302, {
        location: 'https://github.com/apps/x/installations/new',
      });
      res.end();
    } else {
      res.setHeader('content-type', 'application/json');
      res.end('{"ok":true}');
    }
  });
}

/**
 * Starts listening on a free port
 *
 * @param {object} target - The HTTP server
 * @return {Promise<number>} - The port
 */
function listen(target) {
  return new Promise(resolve => {
    target.listen(0, () => resolve(target.address().port));
  });
}

before(async () => {
  core = http.createServer(coreHandler);
  const corePort = await listen(core);

  const probe = http.createServer();
  const port = await listen(probe);
  await new Promise(resolve => probe.close(resolve));

  base = `http://127.0.0.1:${port}`;
  server = spawn('node', ['server/index.js'], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(port),
      API_URL: `http://127.0.0.1:${corePort}`,
    },
    stdio: 'ignore',
  });

  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${base}/health`)).ok) {
        return;
      }
    } catch {
      // Not listening yet
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('webapp did not start');
});

after(() => {
  server?.kill();
  core?.close();
});

for (const path of ['/github', '/github/', '/api/webhooks/migrate']) {
  test(`forwards webhooks on ${path} with headers and an unchanged body`, async () => {
    requests.length = 0;
    const payload = '{"action":"opened",  "number":1}';
    const response = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-github-event': 'pull_request',
        'x-github-delivery': 'delivery-1',
        'x-hub-signature-256': 'sha256=abc',
      },
      body: payload,
    });

    assert.strictEqual(response.status, 200);
    const [forwarded] = requests;
    assert.strictEqual(forwarded.url, path);
    assert.strictEqual(forwarded.headers['x-github-event'], 'pull_request');
    assert.strictEqual(forwarded.headers['x-github-delivery'], 'delivery-1');
    assert.strictEqual(forwarded.headers['x-hub-signature-256'], 'sha256=abc');
    assert.strictEqual(forwarded.body.toString(), payload);
  });
}

test('/login starts OAuth with this host as the callback', async () => {
  const response = await fetch(`${base}/login`, { redirect: 'manual' });

  assert.strictEqual(response.status, 302);
  const location = new URL(response.headers.get('location'), base);
  assert.strictEqual(location.pathname, '/api/login');
  assert.strictEqual(location.searchParams.get('redirect'), '/dashboard');
  assert.match(location.searchParams.get('callback'), /\/github-callback$/);
  assert.match(location.searchParams.get('callback'), /^https:\/\//);
});

test('/api/login without a callback goes through /login', async () => {
  requests.length = 0;
  const response = await fetch(`${base}/api/login`, { redirect: 'manual' });

  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.get('location'), '/login');
  assert.strictEqual(requests.length, 0);
});

test('/api/login with a callback is forwarded to core', async () => {
  requests.length = 0;
  const path = '/login?callback=https%3A%2F%2Fa%2Fgithub-callback';
  const response = await fetch(`${base}/api${path}`, { redirect: 'manual' });

  assert.strictEqual(response.status, 200);
  assert.strictEqual(requests[0].url, path);
});

test('/github-callback sets the session cookie and redirects', async () => {
  const response = await fetch(`${base}/github-callback?code=1&state=2`, {
    redirect: 'manual',
  });

  assert.strictEqual(response.status, 302);
  assert.strictEqual(response.headers.get('location'), '/dashboard');
  const cookie = response.headers.get('set-cookie');
  assert.match(cookie, /^sessionId=abc;/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
});

test('/api/github-callback keeps working for logins in progress', async () => {
  const response = await fetch(`${base}/api/github-callback?code=1&state=2`, {
    redirect: 'manual',
  });

  assert.strictEqual(response.status, 302);
  assert.match(response.headers.get('set-cookie'), /^sessionId=abc;/);
});

test('/api/user/logout clears the session cookie', async () => {
  const response = await fetch(`${base}/api/user/logout`, {
    headers: { cookie: 'sessionId=abc' },
  });

  assert.strictEqual(response.status, 200);
  assert.match(
    response.headers.get('set-cookie'),
    /^sessionId=.*Expires=Thu, 01 Jan 1970/
  );
  assert.strictEqual(requests.at(-1).headers.authorization, 'SESSION abc');
});

test('/install-app passes the redirect from core through', async () => {
  const response = await fetch(`${base}/install-app`, { redirect: 'manual' });

  assert.strictEqual(response.status, 302);
  assert.match(response.headers.get('location'), /github\.com\/apps\//);
});

for (const [path, type] of [
  ['/favicon.ico', /image\/png/],
  ['/robots.txt', /text\/plain/],
  ['/sitemap.xml', /xml/],
]) {
  test(`serves ${path}`, async () => {
    const response = await fetch(`${base}${path}`);

    assert.strictEqual(response.status, 200);
    assert.match(response.headers.get('content-type'), type);
  });
}
