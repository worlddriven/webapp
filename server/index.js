import express from 'express';
import { createServer } from 'vite';
import fs from 'fs';
import proxy from './proxy.js';

const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 3001;

async function startServer() {
  const app = express();

  // Setup Vite middleware (development only)
  let vite;
  if (!isProduction) {
    vite = await createServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
  }

  // Body parsing - use raw to preserve binary data for proxy
  app.use(
    express.raw({
      type: '*/*',
      limit: process.env.REQUEST_BODY_LIMIT || '256mb',
    })
  );

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'worlddriven-webapp',
      version: process.env.GIT_REV || 'unknown',
    });
  });

  // Proxy API requests to backend
  app.use('/api', proxy);

  // Serve static files in production
  if (isProduction) {
    app.use('/assets', express.static('./dist/assets'));
    app.use(express.static('./public'));
  } else {
    // Development: Serve public files
    app.use(express.static('./public'));
  }

  // SPA routing - must be last!
  if (isProduction) {
    // Production: serve pre-built index.html
    app.get('/*', (req, res) => {
      res.sendFile('index.html', { root: './dist' });
    });
  } else {
    // Development: use Vite to transform index.html
    app.get('/*', async (req, res) => {
      try {
        const template = await vite.transformIndexHtml(
          req.originalUrl,
          fs.readFileSync('index.html', 'utf-8')
        );
        res.setHeader('Content-Type', 'text/html');
        res.send(template);
      } catch (error) {
        vite.ssrFixStacktrace(error);
        console.error(error);
        res.status(500).send('Internal Server Error');
      }
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Worlddriven webapp listening on port ${port}`);
    console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
  });
}

startServer();
