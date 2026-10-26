/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LinkItem {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  title?: string;
  userId: string;
  clickCount: number;
  isActive: boolean;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLinkInput {
  originalUrl: string;
  customCode?: string;
  title?: string;
  expiresAt?: string | null;
}

export interface UpdateLinkInput {
  originalUrl?: string;
  title?: string;
  isEnabled?: boolean;
  expiresAt?: string | null;
}

export interface ClickRecord {
  id: string;
  linkId: string;
  timestamp: string;
  referrer?: string;
  userAgent?: string;
  ipHash?: string;
  country?: string;
  city?: string;
  device?: string;
  browser?: string;
  os?: string;
}

export interface BreakdownItem {
  name: string;
  count: number;
  percentage: number;
}

export interface LinkAnalytics {
  linkId: string;
  shortCode: string;
  originalUrl: string;
  title?: string;
  totalClicks: number;
  uniqueVisitors: number;
  clicksOverTime: Array<{
    date: string;
    clicks: number;
  }>;
  topReferrers: BreakdownItem[];
  deviceBreakdown: BreakdownItem[];
  browserBreakdown: BreakdownItem[];
  osBreakdown: BreakdownItem[];
  recentClicks: Array<{
    id: string;
    timestamp: string;
    referrer: string;
    device: string;
    browser: string;
    country?: string;
  }>;
}

export interface OverviewAnalytics {
  totalLinks: number;
  totalClicks: number;
  activeLinksCount: number;
  clicksOverTime: Array<{
    date: string;
    clicks: number;
  }>;
  topPerformingLinks: Array<{
    id: string;
    shortCode: string;
    originalUrl: string;
    title?: string;
    clicks: number;
  }>;
  deviceBreakdown: BreakdownItem[];
  browserBreakdown: BreakdownItem[];
}
