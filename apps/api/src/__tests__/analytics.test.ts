/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.ts';
import { supabaseService } from '../services/supabase.ts';

describe('SmartLink AI - Click Analytics & User-Agent Parsing API', () => {
  beforeEach(() => {
    supabaseService.memoryDb.seedDemoData();
  });

  describe('1. Authentication & Security Enforcement', () => {
    it('GET /api/analytics/overview requires Bearer authorization (401)', async () => {
      const res = await request(app).get('/api/analytics/overview');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/analytics/links/:id requires Bearer authorization (401)', async () => {
      const res = await request(app).get('/api/analytics/links/11111111-1111-1111-1111-111111111101');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('Cross-user analytics isolation: User 1 cannot view User 2 link analytics (403 Forbidden)', async () => {
      // User 2 owns '22222222-2222-2222-2222-222222222201' ('team-express')
      const res = await request(app)
        .get('/api/analytics/links/22222222-2222-2222-2222-222222222201')
        .set('Authorization', 'Bearer demo-token-user-1'); // User 1 token

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toContain('permission');
    });

    it('Returns 404 for non-existent link ID', async () => {
      const res = await request(app)
        .get('/api/analytics/links/99999999-9999-9999-9999-999999999999')
        .set('Authorization', 'Bearer demo-token-user-1');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('2. User Overview Analytics', () => {
    it('GET /api/analytics/overview returns aggregated metrics for authenticated user', async () => {
      const res = await request(app)
        .get('/api/analytics/overview')
        .set('Authorization', 'Bearer demo-token-user-1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data).toHaveProperty('totalLinks');
      expect(data).toHaveProperty('totalClicks');
      expect(data).toHaveProperty('activeLinksCount');
      expect(Array.isArray(data.clicksOverTime)).toBe(true);
      expect(data.clicksOverTime.length).toBe(7); // 7-day timeline
      expect(Array.isArray(data.topPerformingLinks)).toBe(true);
      expect(Array.isArray(data.deviceBreakdown)).toBe(true);
      expect(Array.isArray(data.browserBreakdown)).toBe(true);
    });
  });

  describe('3. Detailed Per-Link Analytics', () => {
    it('GET /api/analytics/links/:id returns time series, referrers, and device breakdown', async () => {
      // Link 1: '11111111-1111-1111-1111-111111111101' (mdn-http)
      const res = await request(app)
        .get('/api/analytics/links/11111111-1111-1111-1111-111111111101')
        .set('Authorization', 'Bearer demo-token-user-1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data.shortCode).toBe('mdn-http');
      expect(data.totalClicks).toBeGreaterThanOrEqual(14);
      expect(data.uniqueVisitors).toBeGreaterThan(0);
      expect(Array.isArray(data.clicksOverTime)).toBe(true);
      expect(Array.isArray(data.topReferrers)).toBe(true);
      expect(Array.isArray(data.deviceBreakdown)).toBe(true);
      expect(Array.isArray(data.browserBreakdown)).toBe(true);
      expect(Array.isArray(data.recentClicks)).toBe(true);

      // Verify referrer extraction
      const referrers = data.topReferrers.map((r: any) => r.name);
      expect(referrers).toContain('twitter.com');
      expect(referrers).toContain('github.com');
    });

    it('returns empty telemetry breakdown for links with zero clicks', async () => {
      // Create a fresh link with zero clicks
      const createRes = await request(app)
        .post('/api/links')
        .set('Authorization', 'Bearer demo-token-user-1')
        .send({
          originalUrl: 'https://example.com/brand-new-link',
          customCode: 'zero-clicks-test',
        });

      const linkId = createRes.body.data.id;

      const res = await request(app)
        .get(`/api/analytics/links/${linkId}`)
        .set('Authorization', 'Bearer demo-token-user-1');

      expect(res.status).toBe(200);
      expect(res.body.data.totalClicks).toBe(0);
      expect(res.body.data.uniqueVisitors).toBe(0);
      expect(res.body.data.topReferrers).toHaveLength(0);
      expect(res.body.data.recentClicks).toHaveLength(0);
    });
  });

  describe('4. Maintained User-Agent and Referrer Parsing on Redirect', () => {
    it('accurately parses mobile user-agent, Safari browser, and cleans referrer', async () => {
      const iPhoneUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
      
      const res = await request(app)
        .get('/s/mdn-http')
        .set('User-Agent', iPhoneUA)
        .set('Referer', 'https://news.ycombinator.com/item?id=123456');

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview');

      // Check that analytics updated
      const analyticsRes = await request(app)
        .get('/api/analytics/links/11111111-1111-1111-1111-111111111101')
        .set('Authorization', 'Bearer demo-token-user-1');

      const recent = analyticsRes.body.data.recentClicks[0];
      expect(recent.device).toBe('mobile');
      expect(recent.browser).toBe('Mobile Safari');
      expect(recent.referrer).toBe('news.ycombinator.com');
    });

    it('handles missing referrers and unknown devices gracefully as Direct / desktop', async () => {
      const res = await request(app)
        .get('/s/mdn-http')
        // No User-Agent and no Referrer sent
        .unset('User-Agent');

      expect(res.status).toBe(302);

      const analyticsRes = await request(app)
        .get('/api/analytics/links/11111111-1111-1111-1111-111111111101')
        .set('Authorization', 'Bearer demo-token-user-1');

      const latest = analyticsRes.body.data.recentClicks[0];
      expect(latest.referrer).toBe('Direct');
      expect(latest.device).toBe('desktop');
    });
  });
});
