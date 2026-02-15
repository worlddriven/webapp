import { Router } from 'express';
import { Readable } from 'stream';

const router = Router();

const apiURL = process.env.API_URL || 'http://localhost:3000';

console.log(`Proxy API requests to: ${apiURL}`);

/**
 * Proxy all API requests to the worlddriven/core backend
 * Converts sessionId cookie to Authorization header
 */
router.all('/', async (req, res) => {
  // Handle root path
  handleProxy(req, res);
});

router.all('/{*path}', async (req, res) => {
  handleProxy(req, res);
});

async function handleProxy(req, res) {
  console.log(`[Proxy] ${req.method} ${req.url} -> ${apiURL}${req.url}`);
  try {
    // Extract sessionId from cookie and convert to Authorization header
    let authorization;
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const cookies = cookieHeader.split(';');
      const sessionCookie = cookies.find(cookie =>
        cookie.trim().startsWith('sessionId')
      );
      if (sessionCookie) {
        authorization = `SESSION ${decodeURIComponent(
          sessionCookie.split('=')[1]
        )}`;
      }
    }

    const url = `${apiURL}${req.url}`;

    // Prepare request options
    const options = {
      method: req.method,
      headers: {
        authorization: authorization,
        'user-agent': req.headers['user-agent'],
        'accept-language': req.headers['accept-language'],
        'content-type': req.headers['content-type'],
      },
    };

    // Add body for non-GET requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      options.body = req.body;
    }

    // Forward request to backend (don't follow redirects - pass them to browser)
    options.redirect = 'manual';
    const response = await fetch(url, options);

    // Handle redirects - pass them through to browser
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      console.log(`[Proxy] Redirect ${response.status} -> ${location}`);
      if (location) {
        res.redirect(response.status, location);
        return;
      }
    }
    console.log(`[Proxy] Response status: ${response.status}`);

    // Copy response headers, excluding:
    // - set-cookie: handled separately for auth
    // - content-encoding: fetch() auto-decompresses, so body is already plain
    // - content-length: no longer accurate after decompression
    const skipHeaders = new Set([
      'set-cookie',
      'content-encoding',
      'content-length',
      'transfer-encoding',
    ]);
    response.headers.forEach((value, key) => {
      if (!skipHeaders.has(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    // Handle auth callback - set httpOnly cookie
    // Supports both /auth/callback (API flow) and /github-callback (redirect flow)
    if (
      (req.url === '/auth/callback' ||
        req.url.startsWith('/github-callback')) &&
      response.ok
    ) {
      const data = await response.json();
      if (data.sessionId) {
        res.cookie('sessionId', data.sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 * 30 * 1000, // 30 days in milliseconds
        });
        delete data.sessionId;
      }
      // For github-callback, redirect to the specified URL
      if (req.url.startsWith('/github-callback') && data.redirect) {
        res.redirect(data.redirect);
        return;
      }
      res.status(response.status).json(data);
      return;
    }

    // Handle logout route - clear cookie
    if (req.url === '/user/logout') {
      res.cookie('sessionId', undefined, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(0),
      });
    }

    // Stream response body
    res.status(response.status);
    if (response.body) {
      const readableStream = Readable.fromWeb(response.body);
      readableStream.pipe(res, { end: true });
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Error in proxy:', error);
    res.status(500).send('Internal Server Error');
  }
}

export default router;
