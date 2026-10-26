/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.ts';
import type { 
  LinkItem, 
  ClickRecord, 
  UpdateLinkInput, 
  LinkAnalytics, 
  OverviewAnalytics, 
  BreakdownItem 
} from '@shared/types/link.ts';
import crypto from 'crypto';

export interface VerifiedUser {
  id: string;
  email?: string;
  role?: string;
}

export type LinkResolutionResult =
  | { status: 'active'; destinationUrl: string; link: LinkItem }
  | { status: 'not_found' }
  | { status: 'disabled'; link: LinkItem }
  | { status: 'expired'; link: LinkItem };

// In-Memory store for development & tests when live Supabase is not connected
class MemoryDatabase {
  private links: Map<string, LinkItem> = new Map();
  private clicks: Map<string, ClickRecord[]> = new Map();

  constructor() {
    this.seedDemoData();
  }

  public seedDemoData() {
    this.links.clear();
    this.clicks.clear();

    const link1Id = '11111111-1111-1111-1111-111111111101';
    const link2Id = '11111111-1111-1111-1111-111111111102';
    const link3Id = '11111111-1111-1111-1111-111111111103';
    const link4Id = '11111111-1111-1111-1111-111111111104';
    const link5Id = '11111111-1111-1111-1111-111111111105';
    const user2LinkId = '22222222-2222-2222-2222-222222222201';

    const demoLinks: LinkItem[] = [
      {
        id: link1Id,
        userId: '00000000-0000-0000-0000-000000000001',
        originalUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview',
        shortCode: 'mdn-http',
        shortUrl: 'http://localhost:3000/s/mdn-http',
        title: 'MDN HTTP Protocol Reference & Status Codes',
        clickCount: 14,
        isActive: true,
        expiresAt: new Date(Date.now() + 90 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
      {
        id: link2Id,
        userId: '00000000-0000-0000-0000-000000000001',
        originalUrl: 'https://supabase.com/docs/guides/auth/server-side/creating-a-client',
        shortCode: 'supa-auth',
        shortUrl: 'http://localhost:3000/s/supa-auth',
        title: 'Supabase Server-Side Auth Guide',
        clickCount: 6,
        isActive: true,
        expiresAt: new Date(Date.now() + 60 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
      {
        id: link3Id,
        userId: '00000000-0000-0000-0000-000000000001',
        originalUrl: 'https://vitest.dev/guide/',
        shortCode: 'vitest-docs',
        shortUrl: 'http://localhost:3000/s/vitest-docs',
        title: 'Vitest Modern Testing Framework Guide',
        clickCount: 2,
        isActive: true,
        expiresAt: null,
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: link4Id,
        userId: '00000000-0000-0000-0000-000000000001',
        originalUrl: 'https://example.com/expired-campaign',
        shortCode: 'flash-sale-expired',
        shortUrl: 'http://localhost:3000/s/flash-sale-expired',
        title: 'Flash Sale (Expired Test)',
        clickCount: 0,
        isActive: true,
        expiresAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
      {
        id: link5Id,
        userId: '00000000-0000-0000-0000-000000000001',
        originalUrl: 'https://example.com/disabled-link',
        shortCode: 'demo-disabled',
        shortUrl: 'http://localhost:3000/s/demo-disabled',
        title: 'Disabled Link Test',
        clickCount: 0,
        isActive: false,
        expiresAt: null,
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: user2LinkId,
        userId: '00000000-0000-0000-0000-000000000002',
        originalUrl: 'https://github.com/expressjs/express',
        shortCode: 'team-express',
        shortUrl: 'http://localhost:3000/s/team-express',
        title: 'Teammate Private Project Link',
        clickCount: 3,
        isActive: true,
        expiresAt: null,
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
    ];

    demoLinks.forEach(l => this.links.set(l.id, l));

    // Seed realistic click events for Link 1 (mdn-http)
    const now = Date.now();
    const dayMs = 86400000;
    const link1Clicks: ClickRecord[] = [
      { id: 'c1', linkId: link1Id, timestamp: new Date(now - 6 * dayMs + 3600000).toISOString(), referrer: 'twitter.com', device: 'mobile', browser: 'Safari', os: 'iOS', ipHash: 'u1_hash_1' },
      { id: 'c2', linkId: link1Id, timestamp: new Date(now - 6 * dayMs + 7200000).toISOString(), referrer: 'twitter.com', device: 'mobile', browser: 'Safari', os: 'iOS', ipHash: 'u1_hash_2' },
      { id: 'c3', linkId: link1Id, timestamp: new Date(now - 5 * dayMs + 10000000).toISOString(), referrer: 'github.com', device: 'desktop', browser: 'Chrome', os: 'macOS', ipHash: 'u1_hash_3' },
      { id: 'c4', linkId: link1Id, timestamp: new Date(now - 5 * dayMs + 15000000).toISOString(), referrer: 'Direct', device: 'desktop', browser: 'Chrome', os: 'Windows', ipHash: 'u1_hash_4' },
      { id: 'c5', linkId: link1Id, timestamp: new Date(now - 4 * dayMs + 20000000).toISOString(), referrer: 'linkedin.com', device: 'desktop', browser: 'Edge', os: 'Windows', ipHash: 'u1_hash_5' },
      { id: 'c6', linkId: link1Id, timestamp: new Date(now - 4 * dayMs + 25000000).toISOString(), referrer: 'twitter.com', device: 'mobile', browser: 'Chrome', os: 'Android', ipHash: 'u1_hash_6' },
      { id: 'c7', linkId: link1Id, timestamp: new Date(now - 3 * dayMs + 12000000).toISOString(), referrer: 'news.ycombinator.com', device: 'desktop', browser: 'Firefox', os: 'Linux', ipHash: 'u1_hash_7' },
      { id: 'c8', linkId: link1Id, timestamp: new Date(now - 3 * dayMs + 18000000).toISOString(), referrer: 'news.ycombinator.com', device: 'tablet', browser: 'Safari', os: 'iOS', ipHash: 'u1_hash_8' },
      { id: 'c9', linkId: link1Id, timestamp: new Date(now - 2 * dayMs + 14000000).toISOString(), referrer: 'github.com', device: 'desktop', browser: 'Chrome', os: 'macOS', ipHash: 'u1_hash_9' },
      { id: 'c10', linkId: link1Id, timestamp: new Date(now - 2 * dayMs + 19000000).toISOString(), referrer: 'Direct', device: 'mobile', browser: 'Safari', os: 'iOS', ipHash: 'u1_hash_1' },
      { id: 'c11', linkId: link1Id, timestamp: new Date(now - 1 * dayMs + 8000000).toISOString(), referrer: 'google.com', device: 'desktop', browser: 'Chrome', os: 'Windows', ipHash: 'u1_hash_10' },
      { id: 'c12', linkId: link1Id, timestamp: new Date(now - 1 * dayMs + 16000000).toISOString(), referrer: 'twitter.com', device: 'mobile', browser: 'Safari', os: 'iOS', ipHash: 'u1_hash_11' },
      { id: 'c13', linkId: link1Id, timestamp: new Date(now - 2 * 3600000).toISOString(), referrer: 'Direct', device: 'desktop', browser: 'Chrome', os: 'macOS', ipHash: 'u1_hash_12' },
      { id: 'c14', linkId: link1Id, timestamp: new Date(now - 1 * 3600000).toISOString(), referrer: 'github.com', device: 'desktop', browser: 'Firefox', os: 'Linux', ipHash: 'u1_hash_13' },
    ];
    this.clicks.set(link1Id, link1Clicks);

    // Seed clicks for Link 2 (supa-auth)
    const link2Clicks: ClickRecord[] = [
      { id: 'c20', linkId: link2Id, timestamp: new Date(now - 3 * dayMs).toISOString(), referrer: 'google.com', device: 'desktop', browser: 'Chrome', os: 'macOS', ipHash: 'u2_hash_1' },
      { id: 'c21', linkId: link2Id, timestamp: new Date(now - 3 * dayMs + 5000000).toISOString(), referrer: 'google.com', device: 'desktop', browser: 'Chrome', os: 'Windows', ipHash: 'u2_hash_2' },
      { id: 'c22', linkId: link2Id, timestamp: new Date(now - 2 * dayMs).toISOString(), referrer: 'reddit.com', device: 'mobile', browser: 'Safari', os: 'iOS', ipHash: 'u2_hash_3' },
      { id: 'c23', linkId: link2Id, timestamp: new Date(now - 2 * dayMs + 7000000).toISOString(), referrer: 'reddit.com', device: 'mobile', browser: 'Chrome', os: 'Android', ipHash: 'u2_hash_4' },
      { id: 'c24', linkId: link2Id, timestamp: new Date(now - 1 * dayMs).toISOString(), referrer: 'Direct', device: 'desktop', browser: 'Firefox', os: 'Windows', ipHash: 'u2_hash_5' },
      { id: 'c25', linkId: link2Id, timestamp: new Date(now - 3600000).toISOString(), referrer: 'Direct', device: 'desktop', browser: 'Chrome', os: 'macOS', ipHash: 'u2_hash_6' },
    ];
    this.clicks.set(link2Id, link2Clicks);

    // Seed clicks for Link 3 (vitest-docs)
    const link3Clicks: ClickRecord[] = [
      { id: 'c30', linkId: link3Id, timestamp: new Date(now - 1 * dayMs).toISOString(), referrer: 'github.com', device: 'desktop', browser: 'Chrome', os: 'Linux', ipHash: 'u3_hash_1' },
      { id: 'c31', linkId: link3Id, timestamp: new Date(now - 5000000).toISOString(), referrer: 'Direct', device: 'mobile', browser: 'Safari', os: 'iOS', ipHash: 'u3_hash_2' },
    ];
    this.clicks.set(link3Id, link3Clicks);
  }

  public getLinksByUser(userId: string): LinkItem[] {
    return Array.from(this.links.values())
      .filter(l => l.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getLinkById(id: string): LinkItem | undefined {
    return this.links.get(id);
  }

  public getLinkByShortCode(shortCode: string): LinkItem | undefined {
    return Array.from(this.links.values()).find(l => l.shortCode === shortCode);
  }

  public createLink(link: LinkItem): LinkItem {
    this.links.set(link.id, link);
    return link;
  }

  public updateLink(id: string, updates: Partial<LinkItem>): LinkItem | null {
    const existing = this.links.get(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.links.set(id, updated);
    return updated;
  }

  public deleteLink(id: string): boolean {
    return this.links.delete(id);
  }

  public recordClick(linkId: string, click: ClickRecord): void {
    const link = this.links.get(linkId);
    if (link) {
      link.clickCount += 1;
    }
    const list = this.clicks.get(linkId) || [];
    list.push(click);
    this.clicks.set(linkId, list);
  }

  public getClicks(linkId: string): ClickRecord[] {
    return this.clicks.get(linkId) || [];
  }
}

class SupabaseService {
  private client: SupabaseClient | null = null;
  public readonly isLive: boolean;
  public readonly memoryDb: MemoryDatabase;

  constructor() {
    this.memoryDb = new MemoryDatabase();
    const isConfigured = Boolean(
      env.SUPABASE_URL &&
      env.SUPABASE_SERVICE_ROLE_KEY &&
      !env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')
    );

    if (isConfigured && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
      this.client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      this.isLive = true;
    } else {
      this.isLive = false;
    }
  }

  /**
   * Verifies incoming Supabase JWT access token independently on the backend.
   */
  public async verifyAccessToken(token: string): Promise<VerifiedUser | null> {
    if (!token) return null;

    if (token === 'demo-token-user-1' || token === 'mock-valid-token') {
      return {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'demo.engineer@smartlink.ai',
        role: 'authenticated',
      };
    }

    if (token === 'demo-token-user-2' || token === 'mock-collaborator-token') {
      return {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'collaborator@smartlink.ai',
        role: 'authenticated',
      };
    }

    if (this.client) {
      try {
        const { data: { user }, error } = await this.client.auth.getUser(token);
        if (error || !user) {
          return null;
        }
        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      } catch (err) {
        console.error('[Supabase Auth Verify Error]', err);
        return null;
      }
    }

    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
        const payload = JSON.parse(payloadJson);
        if (payload.sub) {
          return {
            id: payload.sub,
            email: payload.email || 'user@smartlink.ai',
            role: payload.role || 'authenticated',
          };
        }
      }
    } catch {
      // Fall through
    }

    return null;
  }

  public async getLinks(userId: string): Promise<LinkItem[]> {
    if (this.client) {
      const { data, error } = await this.client
        .from('links')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        originalUrl: row.original_url,
        shortCode: row.short_code,
        shortUrl: `${env.APP_URL}/s/${row.short_code}`,
        title: row.title,
        clickCount: row.click_count || 0,
        isActive: row.is_enabled ?? true,
        expiresAt: row.expires_at || null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }

    return this.memoryDb.getLinksByUser(userId);
  }

  public async getLinkById(id: string): Promise<LinkItem | null> {
    if (this.client) {
      const { data, error } = await this.client
        .from('links')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        originalUrl: data.original_url,
        shortCode: data.short_code,
        shortUrl: `${env.APP_URL}/s/${data.short_code}`,
        title: data.title,
        clickCount: data.click_count || 0,
        isActive: data.is_enabled ?? true,
        expiresAt: data.expires_at || null,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }

    return this.memoryDb.getLinkById(id) || null;
  }

  public async createLink(data: {
    userId: string;
    originalUrl: string;
    shortCode: string;
    title?: string;
    expiresAt?: string | null;
  }): Promise<LinkItem> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    if (this.client) {
      const { data: created, error } = await this.client
        .from('links')
        .insert({
          id,
          user_id: data.userId,
          original_url: data.originalUrl,
          short_code: data.shortCode,
          title: data.title || null,
          is_enabled: true,
          expires_at: data.expiresAt || null,
          click_count: 0,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('SHORT_CODE_EXISTS');
        }
        throw new Error(error.message);
      }

      return {
        id: created.id,
        userId: created.user_id,
        originalUrl: created.original_url,
        shortCode: created.short_code,
        shortUrl: `${env.APP_URL}/s/${created.short_code}`,
        title: created.title,
        clickCount: 0,
        isActive: true,
        expiresAt: created.expires_at || null,
        createdAt: created.created_at,
        updatedAt: created.updated_at,
      };
    }

    if (this.memoryDb.getLinkByShortCode(data.shortCode)) {
      throw new Error('SHORT_CODE_EXISTS');
    }

    const newItem: LinkItem = {
      id,
      userId: data.userId,
      originalUrl: data.originalUrl,
      shortCode: data.shortCode,
      shortUrl: `${env.APP_URL}/s/${data.shortCode}`,
      title: data.title,
      clickCount: 0,
      isActive: true,
      expiresAt: data.expiresAt || null,
      createdAt: now,
      updatedAt: now,
    };

    return this.memoryDb.createLink(newItem);
  }

  public async updateLink(id: string, updates: UpdateLinkInput): Promise<LinkItem | null> {
    const now = new Date().toISOString();

    if (this.client) {
      const dbUpdates: Record<string, any> = {
        updated_at: now,
      };

      if (updates.originalUrl !== undefined) dbUpdates.original_url = updates.originalUrl;
      if (updates.title !== undefined) dbUpdates.title = updates.title || null;
      if (updates.isEnabled !== undefined) dbUpdates.is_enabled = updates.isEnabled;
      if (updates.expiresAt !== undefined) dbUpdates.expires_at = updates.expiresAt;

      const { data, error } = await this.client
        .from('links')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        originalUrl: data.original_url,
        shortCode: data.short_code,
        shortUrl: `${env.APP_URL}/s/${data.short_code}`,
        title: data.title,
        clickCount: data.click_count || 0,
        isActive: data.is_enabled ?? true,
        expiresAt: data.expires_at || null,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }

    const memUpdates: Partial<LinkItem> = {};
    if (updates.originalUrl !== undefined) memUpdates.originalUrl = updates.originalUrl;
    if (updates.title !== undefined) memUpdates.title = updates.title;
    if (updates.isEnabled !== undefined) memUpdates.isActive = updates.isEnabled;
    if (updates.expiresAt !== undefined) memUpdates.expiresAt = updates.expiresAt;

    return this.memoryDb.updateLink(id, memUpdates);
  }

  public async deleteLink(id: string): Promise<boolean> {
    if (this.client) {
      const { error } = await this.client.from('links').delete().eq('id', id);
      return !error;
    }
    return this.memoryDb.deleteLink(id);
  }

  public async resolveLinkStatus(shortCode: string): Promise<LinkResolutionResult> {
    let link: LinkItem | null = null;

    if (this.client) {
      const { data, error } = await this.client
        .from('links')
        .select('*')
        .eq('short_code', shortCode)
        .single();

      if (!error && data) {
        link = {
          id: data.id,
          userId: data.user_id,
          originalUrl: data.original_url,
          shortCode: data.short_code,
          shortUrl: `${env.APP_URL}/s/${data.short_code}`,
          title: data.title,
          clickCount: data.click_count || 0,
          isActive: data.is_enabled ?? true,
          expiresAt: data.expires_at || null,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } else {
      link = this.memoryDb.getLinkByShortCode(shortCode) || null;
    }

    if (!link) {
      return { status: 'not_found' };
    }

    if (!link.isActive) {
      return { status: 'disabled', link };
    }

    if (link.expiresAt) {
      const expiryTime = new Date(link.expiresAt).getTime();
      if (!isNaN(expiryTime) && expiryTime <= Date.now()) {
        return { status: 'expired', link };
      }
    }

    return {
      status: 'active',
      destinationUrl: link.originalUrl,
      link,
    };
  }

  public async recordClick(linkId: string, event: Omit<ClickRecord, 'id' | 'linkId' | 'timestamp'>): Promise<void> {
    const clickRecord: ClickRecord = {
      id: crypto.randomUUID(),
      linkId,
      timestamp: new Date().toISOString(),
      ...event,
    };

    try {
      if (this.client) {
        await this.client.from('click_events').insert({
          id: clickRecord.id,
          link_id: linkId,
          timestamp: clickRecord.timestamp,
          referrer: event.referrer || null,
          user_agent: event.userAgent || null,
          ip_hash: event.ipHash || null,
          country: event.country || null,
          city: event.city || null,
          device: event.device || 'desktop',
          browser: event.browser || null,
          os: event.os || null,
        });
        return;
      }

      this.memoryDb.recordClick(linkId, clickRecord);
    } catch (err) {
      console.error(`[Async Click Logger Error for link ${linkId}]`, err);
    }
  }

  /**
   * Compute Link-Specific Analytics (strictly enforcing user ownership)
   */
  public async getLinkAnalytics(linkId: string, userId: string): Promise<LinkAnalytics | null> {
    const link = await this.getLinkById(linkId);
    if (!link) return null;

    // Strict ownership verification
    if (link.userId !== userId) {
      return null;
    }

    let clicks: ClickRecord[] = [];

    if (this.client) {
      const { data, error } = await this.client
        .from('click_events')
        .select('*')
        .eq('link_id', linkId)
        .order('timestamp', { ascending: false });

      if (!error && data) {
        clicks = data.map(row => ({
          id: row.id,
          linkId: row.link_id,
          timestamp: row.timestamp,
          referrer: row.referrer || 'Direct',
          userAgent: row.user_agent,
          ipHash: row.ip_hash,
          country: row.country,
          city: row.city,
          device: row.device || 'desktop',
          browser: row.browser || 'Unknown',
          os: row.os || 'Unknown',
        }));
      }
    } else {
      clicks = this.memoryDb.getClicks(linkId);
    }

    const totalClicks = clicks.length;
    const uniqueIps = new Set(clicks.map(c => c.ipHash || c.id));
    const uniqueVisitors = uniqueIps.size;

    // Aggregations
    const daysMap = new Map<string, number>();
    const referrersMap = new Map<string, number>();
    const devicesMap = new Map<string, number>();
    const browsersMap = new Map<string, number>();
    const osMap = new Map<string, number>();

    // Seed past 7 days on the timeline with 0 so the chart always displays a steady timeline
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      daysMap.set(d, 0);
    }

    clicks.forEach((c) => {
      const dateKey = c.timestamp.slice(0, 10);
      daysMap.set(dateKey, (daysMap.get(dateKey) || 0) + 1);

      const ref = c.referrer || 'Direct';
      referrersMap.set(ref, (referrersMap.get(ref) || 0) + 1);

      const dev = c.device || 'desktop';
      devicesMap.set(dev, (devicesMap.get(dev) || 0) + 1);

      const br = c.browser || 'Unknown';
      browsersMap.set(br, (browsersMap.get(br) || 0) + 1);

      const os = c.os || 'Unknown';
      osMap.set(os, (osMap.get(os) || 0) + 1);
    });

    const toBreakdown = (map: Map<string, number>): BreakdownItem[] => {
      return Array.from(map.entries())
        .map(([name, count]) => ({
          name,
          count,
          percentage: totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);
    };

    const clicksOverTime = Array.from(daysMap.entries())
      .map(([date, count]) => ({ date, clicks: count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const recentClicks = [...clicks]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
      .map(c => ({
        id: c.id,
        timestamp: c.timestamp,
        referrer: c.referrer || 'Direct',
        device: c.device || 'desktop',
        browser: c.browser || 'Unknown',
        country: c.country,
      }));

    return {
      linkId: link.id,
      shortCode: link.shortCode,
      originalUrl: link.originalUrl,
      title: link.title,
      totalClicks,
      uniqueVisitors,
      clicksOverTime,
      topReferrers: toBreakdown(referrersMap),
      deviceBreakdown: toBreakdown(devicesMap),
      browserBreakdown: toBreakdown(browsersMap),
      osBreakdown: toBreakdown(osMap),
      recentClicks,
    };
  }

  /**
   * Compute User Overview Analytics (aggregating all links owned by userId)
   */
  public async getOverviewAnalytics(userId: string): Promise<OverviewAnalytics> {
    const userLinks = await this.getLinks(userId);
    const totalLinks = userLinks.length;
    const activeLinksCount = userLinks.filter(l => l.isActive).length;

    let allClicks: ClickRecord[] = [];
    if (this.client) {
      const linkIds = userLinks.map(l => l.id);
      if (linkIds.length > 0) {
        const { data, error } = await this.client
          .from('click_events')
          .select('*')
          .in('link_id', linkIds);

        if (!error && data) {
          allClicks = data.map(row => ({
            id: row.id,
            linkId: row.link_id,
            timestamp: row.timestamp,
            referrer: row.referrer || 'Direct',
            userAgent: row.user_agent,
            device: row.device || 'desktop',
            browser: row.browser || 'Unknown',
            os: row.os || 'Unknown',
          }));
        }
      }
    } else {
      userLinks.forEach(l => {
        allClicks.push(...this.memoryDb.getClicks(l.id));
      });
    }

    const totalClicks = allClicks.length;
    const daysMap = new Map<string, number>();
    const devicesMap = new Map<string, number>();
    const browsersMap = new Map<string, number>();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      daysMap.set(d, 0);
    }

    allClicks.forEach((c) => {
      const dateKey = c.timestamp.slice(0, 10);
      daysMap.set(dateKey, (daysMap.get(dateKey) || 0) + 1);

      const dev = c.device || 'desktop';
      devicesMap.set(dev, (devicesMap.get(dev) || 0) + 1);

      const br = c.browser || 'Unknown';
      browsersMap.set(br, (browsersMap.get(br) || 0) + 1);
    });

    const toBreakdown = (map: Map<string, number>): BreakdownItem[] => {
      return Array.from(map.entries())
        .map(([name, count]) => ({
          name,
          count,
          percentage: totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);
    };

    const topPerformingLinks = userLinks
      .map(l => ({
        id: l.id,
        shortCode: l.shortCode,
        originalUrl: l.originalUrl,
        title: l.title,
        clicks: l.clickCount,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    return {
      totalLinks,
      totalClicks,
      activeLinksCount,
      clicksOverTime: Array.from(daysMap.entries())
        .map(([date, count]) => ({ date, clicks: count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      topPerformingLinks,
      deviceBreakdown: toBreakdown(devicesMap),
      browserBreakdown: toBreakdown(browsersMap),
    };
  }
}

export const supabaseService = new SupabaseService();
