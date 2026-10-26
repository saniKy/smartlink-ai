/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { healthRouter } from './health.ts';
import { linksRouter } from './links.ts';
import { analyticsRouter } from './analytics.ts';

export const apiRouter = Router();

// Health check endpoint mounted at /api/health
apiRouter.use('/health', healthRouter);

// Link management endpoints mounted at /api/links (protected by requireAuth)
apiRouter.use('/links', linksRouter);

// Click analytics endpoints mounted at /api/analytics (protected by requireAuth)
apiRouter.use('/analytics', analyticsRouter);

// API Information Root
apiRouter.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'SmartLink AI Backend API',
      description: 'Production-ready REST API for URL shortening and click telemetry',
      version: '1.3.0-phase3',
      endpoints: {
        health: '/api/health',
        links: '/api/links (GET, POST, PATCH, DELETE - protected by Supabase JWT)',
        analyticsOverview: '/api/analytics/overview (GET - protected by Supabase JWT)',
        linkAnalytics: '/api/analytics/links/:id (GET - protected by Supabase JWT)',
        redirect: '/s/:code (Public 302 redirection with async telemetry)',
      },
    },
  });
});
