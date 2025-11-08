import { Router } from 'express';
import { Readable } from 'stream';

const router = Router();

const apiURL = process.env.API_URL || 'http://localhost:3000';

console.log(`Proxy API requests to: ${apiURL}`);

/**
 * Proxy all API requests to the worlddriven/core backend
 * Converts sessionId cookie to Authorization header
 */
router.all('*', async (req, res) => {
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

    // Forward request to backend
    const response = await fetch(url, options);

    // Copy response headers (excluding set-cookie which we handle separately)
    Object.entries(response.headers.raw()).forEach(([key, value]) => {
      if (key.toLowerCase() !== 'set-cookie') {
        res.setHeader(key, value);
      }
    });

    // Handle login route - set httpOnly cookie
    if (req.url === '/auth/login' && response.ok) {
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
});

export default router;
