/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { type Express } from 'express';
import cors from 'cors';
import { apiRouter } from './routes/index.ts';
import { redirectRouter } from './routes/redirect.ts';
import { errorHandler } from './middleware/error.ts';
import { env } from './config/env.ts';

export function createApp(): Express {
  const app = express();

  // Basic security and parsing middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Public short URL redirect handler mounted at /s/:code
  app.use('/s', redirectRouter);

  // Mount API router under configured prefix (default: /api)
  app.use(env.API_PREFIX, apiRouter);

  // Error handling middleware (must be registered after routes)
  app.use(errorHandler);

  return app;
}

export const app = createApp();
