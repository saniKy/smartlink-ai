/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

// Strict HTTP/HTTPS URL Validator
const httpUrlSchema = z
  .string()
  .trim()
  .min(1, 'Destination URL is required')
  .max(2048, 'Destination URL must not exceed 2048 characters')
  .refine(
    (val) => {
      try {
        const parsed = new URL(val);
        // Explicitly only accept http and https schemes
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    },
    {
      message: 'Only valid HTTP and HTTPS destination URLs are allowed (e.g. https://example.com)',
    }
  );

// Custom Alias / Short Code Validator
const shortCodeSchema = z
  .string()
  .trim()
  .min(3, 'Custom alias must be at least 3 characters long')
  .max(32, 'Custom alias must not exceed 32 characters')
  .regex(
    /^[a-zA-Z0-9_-]{3,32}$/,
    'Custom alias must contain only alphanumeric characters, hyphens, or underscores'
  );

// Expiry Date Validator (must be future ISO timestamp if provided)
const expiryDateSchema = z
  .string()
  .datetime({ message: 'Expiration date must be a valid ISO 8601 timestamp' })
  .refine(
    (val) => {
      return new Date(val).getTime() > Date.now();
    },
    {
      message: 'Expiration date must be set in the future',
    }
  )
  .optional()
  .nullable();

export const createLinkSchema = z.object({
  originalUrl: httpUrlSchema,
  customCode: shortCodeSchema.optional(),
  title: z.string().trim().max(255, 'Title must not exceed 255 characters').optional(),
  expiresAt: expiryDateSchema,
});

export const updateLinkSchema = z.object({
  originalUrl: httpUrlSchema.optional(),
  title: z.string().trim().max(255, 'Title must not exceed 255 characters').optional(),
  isEnabled: z.boolean().optional(),
  expiresAt: expiryDateSchema,
});

export type CreateLinkDto = z.infer<typeof createLinkSchema>;
export type UpdateLinkDto = z.infer<typeof updateLinkSchema>;
