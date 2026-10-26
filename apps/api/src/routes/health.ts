/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { env } from '../config/env.ts';
import { supabaseService } from '../services/supabase.ts';
import type { ApiSuccessResponse, HealthResponse } from '@shared/types/api.ts';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response<ApiSuccessResponse<HealthResponse>>) => {
  const dbConnected = supabaseService.isLive;
  const authConfigured = Boolean(env.SUPABASE_URL && (env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY));

  const healthData: HealthResponse = {
    status: 'healthy',
    service: 'smartlink-ai-api',
    version: '1.2.0-phase2',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
    checks: {
      api: 'ok',
      database: dbConnected ? 'connected' : 'unconfigured',
      auth: authConfigured ? 'ready' : 'unconfigured',
    },
  };

  res.status(200).json({
    success: true,
    data: healthData,
    meta: {
      timestamp: healthData.timestamp,
    },
  });
});
