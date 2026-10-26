/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Request, Response, NextFunction } from 'express';
import type { ApiErrorResponse } from '@shared/types/api.ts';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export class UserRateLimiter {
  private store = new Map<string, RateLimitRecord>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  public check(userId: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = this.store.get(userId);

    if (!record || now > record.resetTime) {
      const resetTime = now + this.windowMs;
      this.store.set(userId, { count: 1, resetTime });
      return { allowed: true, remaining: this.maxRequests - 1, resetTime };
    }

    if (record.count >= this.maxRequests) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }

    record.count += 1;
    return {
      allowed: true,
      remaining: this.maxRequests - record.count,
      resetTime: record.resetTime,
    };
  }

  public reset(userId?: string): void {
    if (userId) {
      this.store.delete(userId);
    } else {
      this.store.clear();
    }
  }
}

// Default instance: 10 links per 60 seconds per user
export const linkCreationLimiter = new UserRateLimiter(10, 60000);

export function rateLimitUserLinkCreation(
  limiter: UserRateLimiter = linkCreationLimiter
) {
  return (req: Request, res: Response<ApiErrorResponse>, next: NextFunction): void => {
    const userId = req.user?.id;

    if (!userId) {
      return next();
    }

    const { allowed, remaining, resetTime } = limiter.check(userId);
    const retryAfterSeconds = Math.ceil((resetTime - Date.now()) / 1000);

    res.setHeader('X-RateLimit-Limit', 10);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));

    if (!allowed) {
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many link creation requests. Rate limit is 10 links per minute. Please retry in ${retryAfterSeconds} seconds.`,
        },
      });
      return;
    }

    next();
  };
}
