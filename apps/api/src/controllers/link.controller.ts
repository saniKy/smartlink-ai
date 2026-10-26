/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Request, Response } from 'express';
import { supabaseService } from '../services/supabase.ts';
import { createLinkSchema, updateLinkSchema } from '../schemas/link.ts';
import type { ApiSuccessResponse, ApiErrorResponse } from '@shared/types/api.ts';
import type { LinkItem } from '@shared/types/link.ts';
import crypto from 'crypto';

function generateShortCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.randomBytes(7);
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export class LinkController {
  /**
   * GET /api/links
   */
  public async listLinks(req: Request, res: Response<ApiSuccessResponse<LinkItem[]> | ApiErrorResponse>) {
    try {
      const userId = req.user!.id;
      const links = await supabaseService.getLinks(userId);

      return res.status(200).json({
        success: true,
        data: links,
        meta: {
          timestamp: new Date().toISOString(),
          total: links.length,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve links';
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_LINKS_ERROR',
          message,
        },
      });
    }
  }

  /**
   * POST /api/links
   */
  public async createLink(req: Request, res: Response<ApiSuccessResponse<LinkItem> | ApiErrorResponse>) {
    const parseResult = createLinkSchema.safeParse(req.body);

    if (!parseResult.success) {
      const issues = (parseResult.error as any).issues || (parseResult.error as any).errors || [];
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input parameters for link creation',
          details: issues.map((e: any) => ({
            field: Array.isArray(e.path) ? e.path.join('.') : undefined,
            message: e.message,
          })),
        },
      });
    }

    const { originalUrl, customCode, title, expiresAt } = parseResult.data;
    const shortCode = customCode || generateShortCode();
    const userId = req.user!.id; // Strictly derived from verified JWT

    try {
      const createdLink = await supabaseService.createLink({
        userId,
        originalUrl,
        shortCode,
        title,
        expiresAt: expiresAt || null,
      });

      return res.status(201).json({
        success: true,
        data: createdLink,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'SHORT_CODE_EXISTS') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'SHORT_CODE_COLLISION',
            message: `The custom alias "${shortCode}" is already in use. Please select a different alias.`,
          },
        });
      }

      const message = err instanceof Error ? err.message : 'Failed to create link';
      return res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_LINK_ERROR',
          message,
        },
      });
    }
  }

  /**
   * GET /api/links/:id
   */
  public async getLink(req: Request, res: Response<ApiSuccessResponse<LinkItem> | ApiErrorResponse>) {
    try {
      const link = await supabaseService.getLinkById(req.params.id);

      if (!link) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Link not found',
          },
        });
      }

      // Enforce strict ownership: never expose private links to other users
      if (link.userId !== req.user!.id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to view this link resource.',
          },
        });
      }

      return res.status(200).json({
        success: true,
        data: link,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error retrieving link';
      return res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_LINK_ERROR',
          message,
        },
      });
    }
  }

  /**
   * PATCH /api/links/:id
   */
  public async updateLink(req: Request, res: Response<ApiSuccessResponse<LinkItem> | ApiErrorResponse>) {
    const parseResult = updateLinkSchema.safeParse(req.body);

    if (!parseResult.success) {
      const issues = (parseResult.error as any).issues || (parseResult.error as any).errors || [];
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input parameters for link update',
          details: issues.map((e: any) => ({
            field: Array.isArray(e.path) ? e.path.join('.') : undefined,
            message: e.message,
          })),
        },
      });
    }

    try {
      const existing = await supabaseService.getLinkById(req.params.id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Link not found',
          },
        });
      }

      // Enforce ownership: reject cross-user modification
      if (existing.userId !== req.user!.id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to modify this link resource.',
          },
        });
      }

      const updated = await supabaseService.updateLink(req.params.id, parseResult.data);

      if (!updated) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to apply updates to link',
          },
        });
      }

      return res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error updating link';
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_LINK_ERROR',
          message,
        },
      });
    }
  }

  /**
   * DELETE /api/links/:id
   */
  public async deleteLink(req: Request, res: Response<ApiSuccessResponse<{ id: string; deleted: boolean }> | ApiErrorResponse>) {
    try {
      const link = await supabaseService.getLinkById(req.params.id);

      if (!link) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Link not found',
          },
        });
      }

      // Ownership enforcement
      if (link.userId !== req.user!.id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this link resource.',
          },
        });
      }

      await supabaseService.deleteLink(req.params.id);

      return res.status(200).json({
        success: true,
        data: {
          id: req.params.id,
          deleted: true,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error deleting link';
      return res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_LINK_ERROR',
          message,
        },
      });
    }
  }
}

export const linkController = new LinkController();
