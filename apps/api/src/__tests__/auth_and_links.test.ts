/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.ts';
import { supabaseService } from '../services/supabase.ts';

describe('SmartLink AI - Authentication & Link Management API', () => {
  beforeEach(() => {
    supabaseService.memoryDb.seedDemoData();
  });

  describe('Authentication Enforcement', () => {
    it('GET /api/links should reject requests without Authorization header (401)', async () => {
      const res = await request(app).get('/api/links');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/links should reject invalid tokens (401)', async () => {
      const res = await request(app)
        .get('/api/links')
        .set('Authorization', 'Bearer invalid-token-xyz');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    it('GET /api/links should accept valid verified Supabase tokens and return user links', async () => {
      const res = await request(app)
        .get('/api/links')
        .set('Authorization', 'Bearer demo-token-user-1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      // All returned links must belong exclusively to User 1
      res.body.data.forEach((link: any) => {
        expect(link.userId).toBe('00000000-0000-0000-0000-000000000001');
      });
    });
  });

  describe('Ownership Isolation (User A vs User B)', () => {
    it('User 1 cannot see User 2 private links', async () => {
      const resUser1 = await request(app)
        .get('/api/links')
        .set('Authorization', 'Bearer demo-token-user-1');

      const resUser2 = await request(app)
        .get('/api/links')
        .set('Authorization', 'Bearer demo-token-user-2');

      const user1ShortCodes = resUser1.body.data.map((l: any) => l.shortCode);
      const user2ShortCodes = resUser2.body.data.map((l: any) => l.shortCode);

      // User 2 owns 'team-express'
      expect(user2ShortCodes).toContain('team-express');
      expect(user1ShortCodes).not.toContain('team-express');
    });

    it('User 1 cannot delete User 2 link (403 Forbidden)', async () => {
      // User 2's link ID is 22222222-2222-2222-2222-222222222201
      const res = await request(app)
        .delete('/api/links/22222222-2222-2222-2222-222222222201')
        .set('Authorization', 'Bearer demo-token-user-1');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Server-Side Input Validation & Spoofing Prevention', () => {
    it('Never trusts client-supplied user_id in payload', async () => {
      // Attempting to inject a different user_id in the body
      const res = await request(app)
        .post('/api/links')
        .set('Authorization', 'Bearer demo-token-user-1')
        .send({
          originalUrl: 'https://example.com/secure-test',
          customCode: 'secure-slug-1',
          user_id: '00000000-0000-0000-0000-999999999999', // Spoofed target
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      // Backend must strictly attribute link to verified token's user id!
      expect(res.body.data.userId).toBe('00000000-0000-0000-0000-000000000001');
      expect(res.body.data.userId).not.toBe('00000000-0000-0000-0000-999999999999');
    });

    it('Rejects invalid URLs with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/links')
        .set('Authorization', 'Bearer demo-token-user-1')
        .send({
          originalUrl: 'not-a-valid-url',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('Rejects duplicate custom slugs with 409 Conflict', async () => {
      // 'mdn-http' already exists in seed data
      const res = await request(app)
        .post('/api/links')
        .set('Authorization', 'Bearer demo-token-user-1')
        .send({
          originalUrl: 'https://developer.mozilla.org/en-US/docs/Web',
          customCode: 'mdn-http',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SHORT_CODE_COLLISION');
    });
  });

  describe('Public URL Redirection', () => {
    it('GET /s/:code redirects with 302 to original URL', async () => {
      const res = await request(app).get('/s/mdn-http');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview');
    });

    it('GET /s/:code returns 404 for non-existent short code', async () => {
      const res = await request(app).get('/s/non-existent-code');
      expect(res.status).toBe(404);
    });
  });
});
