/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.ts';
import { analyticsController } from '../controllers/analytics.controller.ts';

export const analyticsRouter = Router();

// Protect all analytics endpoints with Supabase Auth verification
analyticsRouter.use(requireAuth);

// Aggregated overview analytics across user links
analyticsRouter.get('/overview', (req, res) => analyticsController.getOverview(req, res));

// Detailed per-link analytics (ownership verified)
analyticsRouter.get('/links/:id', (req, res) => analyticsController.getLinkAnalytics(req, res));
