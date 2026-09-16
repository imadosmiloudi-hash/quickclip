import { Router } from 'express';

export const rootRouter = Router();

rootRouter.get('/', (_req, res) => {
  const payload = {
    name: 'QUICKCLIP API',
    status: 'ok',
    health: '/health',
    endpoints: {
      health: 'GET /health',
      register: 'POST /auth/register',
      login: 'POST /auth/login',
      folders: 'GET|POST /folders',
      content: 'GET|POST /content',
      media: 'POST /media',
      sync: 'POST /sync/pull | POST /sync/push',
    },
  };

  const accept = String(_req.headers.accept ?? '');
  if (accept.includes('text/html')) {
    res.type('html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>QUICKCLIP API</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
    code { background: #f2f2f2; padding: 0.1rem 0.35rem; border-radius: 4px; }
    a { color: #0b57d0; }
  </style>
</head>
<body>
  <h1>QUICKCLIP API</h1>
  <p>Backend is running. This is an API, not a website.</p>
  <p>Health check: <a href="/health"><code>/health</code></a></p>
  <ul>
    <li><code>POST /auth/register</code></li>
    <li><code>POST /auth/login</code></li>
    <li><code>GET|POST /folders</code></li>
    <li><code>GET|POST /content</code></li>
    <li><code>POST /media</code></li>
    <li><code>POST /sync/pull</code> · <code>POST /sync/push</code></li>
  </ul>
</body>
</html>`);
    return;
  }

  res.json(payload);
});
