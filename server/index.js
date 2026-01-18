import express from 'express';
import fs from 'fs';
import path from 'path';
import proxy from './proxy.js';

const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 3001;

async function startServer() {
  const app = express();

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

  // Proxy API requests to backend - MUST be before static/Vite middleware
  app.use('/api', proxy);

  // Setup Vite middleware (development only)
  let vite;
  if (!isProduction) {
    const { createServer } = await import('vite');
    vite = await createServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
  }

  // Serve static files (landing page, images, css)
  app.use(express.static('./public'));

  // In production, serve built assets from dist/
  if (isProduction) {
    app.use(express.static('./dist'));
  }

  // Static pages (no React) - served from public/
  app.get('/', (req, res) => {
    res.sendFile('index.html', { root: './public' });
  });

  app.get('/imprint', (req, res) => {
    res.sendFile('imprint.html', { root: './public' });
  });

  app.get('/privacyPolicy', (req, res) => {
    res.sendFile('privacyPolicy.html', { root: './public' });
  });

  // React pages - serve from dist/ in production, transform with Vite in development
  const serveReactPage = async (req, res, htmlFile) => {
    if (isProduction) {
      // Serve pre-built HTML from dist/
      res.sendFile(htmlFile, { root: './dist' });
    } else {
      // Transform HTML with Vite (handles JSX imports)
      try {
        const template = await vite.transformIndexHtml(
          req.originalUrl,
          fs.readFileSync(path.join('.', htmlFile), 'utf-8')
        );
        res.setHeader('Content-Type', 'text/html');
        res.send(template);
      } catch (error) {
        vite.ssrFixStacktrace(error);
        console.error(error);
        res.status(500).send('Internal Server Error');
      }
    }
  };

  app.get('/dashboard', (req, res) =>
    serveReactPage(req, res, 'dashboard.html')
  );

  app.get('/admin', (req, res) => serveReactPage(req, res, 'admin.html'));

  // PR pages: /:owner/:repo/pull/:number
  app.get('/:owner/:repo/pull/:number', (req, res) => {
    serveReactPage(req, res, 'pull_request.html');
  });

  // Test routes
  app.get('/test/dashboard', (req, res) =>
    serveReactPage(req, res, 'dashboard.html')
  );
  app.get('/test/:owner/:repo/pull/:number', (req, res) => {
    serveReactPage(req, res, 'pull_request.html');
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`Worlddriven webapp listening on port ${port}`);
    console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
  });
}

startServer();
