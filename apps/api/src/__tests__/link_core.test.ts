/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.ts';
import { supabaseService } from '../services/supabase.ts';
import { linkCreationLimiter, UserRateLimiter } from '../middleware/rateLimit.ts';

describe('SmartLink AI - Core URL Shortener Backend Functionality', () => {
  beforeEach(() => {
    supabaseService.memoryDb.seedDemoData();
    linkCreationLimiter.reset();
  });

  describe('1. Destination URL Scheme & Malformed Input Validation', () => {
    it('accepts valid HTTPS destination URLs', async () => {
      const res = await request(app)
        .post('/api/links')
        .set('Authorization', 'Bearer demo-token-user-1')
        .send({
          originalUrl: 'https://docs.github.com/en/rest',
          title: 'GitHub REST API Docs',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.originalUrl).toBe('https://docs.github.com/en/rest');
    });

    it('accepts valid HTTP destination URLs', async () => {
      const res = await request(app)
        .post('/api/links')
        .set('Authorization', 'Bearer demo-token-user-1')
        .send({
          originalUrl: 'http://info.cern.ch/hypertext/WWW/TheProject.html',
          title: 'First Website',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.originalUrl).toBe('http://info.cern.ch/hypertext/WWW/TheProject.html');
    });

    it('strictly rejects javascript: pseudo-protocol URIs (XSS vector)', async () => {
      const res = await request(app)
        .post('/api/links')
        .set('Authorization', 'Bearer demo-token-user-1')
        .send({
          originalUrl: 'javascript:alert(document.cookie)',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('strictly rejects data: URIs', async () => {
      const res = await request(app)
        .post('/api/links')
        .set('Authorization', 'Bearer demo-token-user-1')
        .send({
          originalUrl: 'data:text/html,<script>alert("hacked")</script>',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('strictly rejects ftp: schemes', async () => {
      const res = await request(app)
        .post('/api/links')
        .set('Authorization', 'Bearer demo-token-user-1')
        .send({
          originalUrl: 'ftp://ftp.example.com/files/archive.tar.gz',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects malformed URLs without valid hostname', async () => {
      const res = await request(app)
        .post('/api/links')
        .set('Authorization', 'Bearer demo-token-user-1')
        .send({
          originalUrl: 'htp:/not-a-real-url',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Custom Alias Conflicts & Format Enforcement', () => {
    it('rejects duplicate custom aliases with 409 Conflict', async () => {
      // 'mdn-http' already exists in the seed database
      const res = await request(app)
        .post('/api/links')
        .set('Authorization', 'Bearer demo-token-user-1')
        .send({
          originalUrl: 'https://example.com/conflict',
          customCode: 'mdn-http',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SHORT_CODE_COLLISION');
      expect(res.body.error.message).toContain('already in use');
    });

    it('rejects custom aliases shorter than 3 characters', async () => {
      const res = await request(app)
        .post('/api/links')
        .set('Authorization', 'Bearer demo-token-user-1')
        .send({
          originalUrl: 'https://example.com/short-alias',
          customCode: 'ab',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects custom aliases with special characters or spaces', async () => {
      const res = await request(app)
        .post('/api/links')
        .set('Authorization', 'Bearer demo-token-user-1')
        .send({
          originalUrl: 'https://example.com/special',
          customCode: 'my alias$!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('generates a collision-resistant 7-character alphanumeric alias when custom alias is omitted', async () => {
      const res = await request(app)
        .post('/api/links')
        .set('Authorization', 'Bearer demo-token-user-1')
        .send({
          originalUrl: 'https://example.com/auto-generated-slug',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.shortCode).toBeDefined();
      expect(res.body.data.shortCode).toMatch(/^[a-zA-Z0-9]{7}$/);

      // Verify redirection works with generated alias
      const redirectRes = await request(app).get(`/s/${res.body.data.shortCode}`);
      expect(redirectRes.status).toBe(302);
      expect(redirectRes.headers.location).toBe('https://example.com/auto-generated-slug');
    });
  });

  describe('3. Expiration Dates & Routing Behavior', () => {
    it('rejects expiration dates set in the past', async () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString();
      const res = await request(app)
        .post('/api/links')
        .set('Authorization', 'Bearer demo-token-user-1')
        .send({
          originalUrl: 'https://example.com/past-expiry',
          expiresAt: pastDate,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid input parameters');
    });

    it('allows valid future expiration dates', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString(); // 1 day in future
      const res = await request(app)
        .post('/api/links')
        .set('Authorization', 'Bearer demo-token-user-1')
        .send({
          originalUrl: 'https://example.com/future-promo',
          customCode: 'promo-2026',
          expiresAt: futureDate,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.expiresAt).toBe(futureDate);
    });

    it('returns 410 Gone with expired notice when redirecting to an expired link', async () => {
      // 'flash-sale-expired' was seeded with a past expiration date
      const res = await request(app).get('/s/flash-sale-expired');
      expect(res.status).toBe(410);
      expect(res.text).toContain('Link Expired');
    });
  });

  describe('4. Link Management: Edit Destinations, Toggle Disabled & Delete', () => {
    it('allows link owner to update destination URL and title', async () => {
      const res = await request(app)
        .patch('/api/links/11111111-1111-1111-1111-111111111101')
        .set('Authorization', 'Bearer demo-token-user-1')
        .send({
          originalUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers',
          title: 'MDN Updated Headers Guide',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.originalUrl).toBe('https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers');
      expect(res.body.data.title).toBe('MDN Updated Headers Guide');

      // Verify public redirect routes to updated destination URL
      const redirectRes = await request(app).get('/s/mdn-http');
      expect(redirectRes.status).toBe(302);
      expect(redirectRes.headers.location).toBe('https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers');
    });

    it('allows link owner to deactivate link (returns 410 when deactivated)', async () => {
      // Deactivate link
      const patchRes = await request(app)
        .patch('/api/links/11111111-1111-1111-1111-111111111101')
        .set('Authorization', 'Bearer demo-token-user-1')
        .send({
          isEnabled: false,
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.isActive).toBe(false);

      // Verify redirect returns 410
      const redirectRes = await request(app).get('/s/mdn-http');
      expect(redirectRes.status).toBe(410);
      expect(redirectRes.text).toContain('Link Disabled');
    });

    it('allows link owner to delete their link', async () => {
      const delRes = await request(app)
        .delete('/api/links/11111111-1111-1111-1111-111111111101')
        .set('Authorization', 'Bearer demo-token-user-1');

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      // Verify redirect now returns 404
      const redirectRes = await request(app).get('/s/mdn-http');
      expect(redirectRes.status).toBe(404);
    });
  });

  describe('5. Cross-User Authorization & Ownership Protections', () => {
    it('rejects cross-user link modifications (403 Forbidden)', async () => {
      // User 2 owns '22222222-2222-2222-2222-222222222201' ('team-express')
      const res = await request(app)
        .patch('/api/links/22222222-2222-2222-2222-222222222201')
        .set('Authorization', 'Bearer demo-token-user-1') // User 1 trying to edit User 2's link
        .send({
          originalUrl: 'https://attacker.com/malicious',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('rejects cross-user link deletions (403 Forbidden)', async () => {
      const res = await request(app)
        .delete('/api/links/22222222-2222-2222-2222-222222222201')
        .set('Authorization', 'Bearer demo-token-user-1'); // User 1 trying to delete User 2's link

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('6. Per-User Link Creation Rate Limiting', () => {
    it('enforces link creation limits and returns 429 Too Many Requests with Retry-After header', async () => {
      // Create 10 links rapidly to hit the threshold
      for (let i = 0; i < 10; i++) {
        const res = await request(app)
          .post('/api/links')
          .set('Authorization', 'Bearer demo-token-user-1')
          .send({
            originalUrl: `https://example.com/rate-test-${i}`,
          });
        expect(res.status).toBe(201);
      }

      // The 11th request must be rejected with 429
      const rateLimitedRes = await request(app)
        .post('/api/links')
        .set('Authorization', 'Bearer demo-token-user-1')
        .send({
          originalUrl: 'https://example.com/exceeded-limit',
        });

      expect(rateLimitedRes.status).toBe(429);
      expect(rateLimitedRes.body.success).toBe(false);
      expect(rateLimitedRes.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(rateLimitedRes.headers).toHaveProperty('retry-after');

      // User 2 should NOT be blocked because rate limiting is strictly isolated per user
      const user2Res = await request(app)
        .post('/api/links')
        .set('Authorization', 'Bearer demo-token-user-2')
        .send({
          originalUrl: 'https://example.com/user2-request',
        });
      expect(user2Res.status).toBe(201);
    });
  });

  describe('7. Malformed Payloads & Missing Link Handling', () => {
    it('returns 400 Validation Error when payload contains non-string URL', async () => {
      const res = await request(app)
        .post('/api/links')
        .set('Authorization', 'Bearer demo-token-user-1')
        .send({
          originalUrl: 12345, // invalid type
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 when public redirect requested for non-existent short code', async () => {
      const res = await request(app).get('/s/definitely-not-a-valid-short-code-12345');
      expect(res.status).toBe(404);
      expect(res.text).toContain('404');
      expect(res.text).toContain('Short Link Not Found');
    });

    it('returns 404 when requesting missing link ID via GET /api/links/:id', async () => {
      const res = await request(app)
        .get('/api/links/00000000-0000-0000-0000-000000000999')
        .set('Authorization', 'Bearer demo-token-user-1');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
