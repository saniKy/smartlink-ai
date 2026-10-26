/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Request, Response } from 'express';
import { supabaseService } from '../services/supabase.ts';
import type { ApiSuccessResponse, ApiErrorResponse } from '@shared/types/api.ts';
import type { LinkAnalytics, OverviewAnalytics } from '@shared/types/link.ts';

export class AnalyticsController {
  /**
   * GET /api/analytics/overview
   * Returns aggregated click metrics and top links for the authenticated user.
   */
  public async getOverview(req: Request, res: Response<ApiSuccessResponse<OverviewAnalytics> | ApiErrorResponse>) {
    try {
      const userId = req.user!.id;
      const analytics = await supabaseService.getOverviewAnalytics(userId);

      return res.status(200).json({
        success: true,
        data: analytics,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve overview analytics';
      return res.status(500).json({
        success: false,
        error: {
          code: 'ANALYTICS_OVERVIEW_ERROR',
          message,
        },
      });
    }
  }

  /**
   * GET /api/analytics/links/:id
   * Returns per-link clicks over time, referrers, device/browser breakdowns.
   * Strictly enforces link ownership!
   */
  public async getLinkAnalytics(req: Request, res: Response<ApiSuccessResponse<LinkAnalytics> | ApiErrorResponse>) {
    const { id } = req.params;
    const userId = req.user!.id;

    try {
      const link = await supabaseService.getLinkById(id);

      if (!link) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Link not found',
          },
        });
      }

      // Ownership enforcement: never expose private link telemetry across users
      if (link.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view analytics for this link.',
          },
        });
      }

      const analytics = await supabaseService.getLinkAnalytics(id, userId);

      if (!analytics) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Analytics data unavailable for this link',
          },
        });
      }

      return res.status(200).json({
        success: true,
        data: analytics,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve link analytics';
      return res.status(500).json({
        success: false,
        error: {
          code: 'LINK_ANALYTICS_ERROR',
          message,
        },
      });
    }
  }
}

export const analyticsController = new AnalyticsController();
