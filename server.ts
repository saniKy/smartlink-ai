/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { app } from './apps/api/src/app.ts';
import { env } from './apps/api/src/config/env.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const port = env.PORT || 3000;

  if (!isProd) {
    // Dynamic import of Vite in development mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    // Mount Vite dev server middleware AFTER Express /api routes
    app.use(vite.middlewares);
  } else {
    // Serve static production build
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`[SmartLink AI] Full-stack application running at http://localhost:${port}`);
    console.log(`[SmartLink AI] Health endpoint: http://localhost:${port}/api/health`);
  });
}

startServer().catch((err) => {
  console.error('[SmartLink AI Server Startup Error]:', err);
  process.exit(1);
});
