/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Request, Response, NextFunction } from 'express';
import { supabaseService, type VerifiedUser } from '../services/supabase.ts';
import type { ApiErrorResponse } from '@shared/types/api.ts';

// Extend Express Request interface with authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: VerifiedUser;
    }
  }
}

/**
 * Authentication Middleware:
 * Independently verifies Supabase JWT access tokens.
 * Enforces ownership and never trusts user_id supplied by the browser.
 */
export async function requireAuth(
  req: Request,
  res: Response<ApiErrorResponse>,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Missing or malformed Bearer token in Authorization header.',
      },
    });
    return;
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Empty authorization token provided.',
      },
    });
    return;
  }

  try {
    const verifiedUser = await supabaseService.verifyAccessToken(token);

    if (!verifiedUser) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'The provided Supabase access token is invalid, expired, or revoked.',
        },
      });
      return;
    }

    // Explicitly delete any client-supplied user_id to prevent privilege escalation / impersonation
    if (req.body && typeof req.body === 'object') {
      delete req.body.user_id;
      delete req.body.userId;
    }

    // Attach verified user identity from backend token verification
    req.user = verifiedUser;
    next();
  } catch (err) {
    console.error('[Auth Middleware Verification Error]', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_VERIFICATION_ERROR',
        message: 'An error occurred while verifying your session token.',
      },
    });
  }
}
