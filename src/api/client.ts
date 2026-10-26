/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ApiResponse, HealthResponse } from '@shared/types/api.ts';
import type { 
  LinkItem, 
  CreateLinkInput, 
  UpdateLinkInput, 
  LinkAnalytics, 
  OverviewAnalytics 
} from '@shared/types/link.ts';

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: Array<{ field?: string; message: string }>;

  constructor(message: string, status = 500, code = 'API_CLIENT_ERROR', details?: Array<{ field?: string; message: string }>) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ApiClient {
  private baseUrl: string;
  private token: string | null = 'demo-token-user-1'; // Default to demo session for instant local interaction

  constructor(baseUrl = '') {
    const envBase = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '';
    this.baseUrl = baseUrl || envBase;
  }

  public setAuthToken(token: string | null): void {
    this.token = token;
  }

  public getAuthToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const json = (await response.json()) as ApiResponse<T>;

      if (!response.ok || !json.success) {
        if (!json.success && 'error' in json) {
          throw new ApiClientError(
            json.error.message || `Request failed with status ${response.status}`,
            response.status,
            json.error.code,
            json.error.details
          );
        }
        throw new ApiClientError(`HTTP error ${response.status}`, response.status);
      }

      return json.data;
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        throw err;
      }
      const message = err instanceof Error ? err.message : 'Network communication failed';
      throw new ApiClientError(message, 0, 'NETWORK_ERROR');
    }
  }

  /**
   * Health Check: queries Express /api/health
   */
  public async checkHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/api/health');
  }

  /**
   * API Metadata: queries Express /api
   */
  public async getApiInfo(): Promise<{ name: string; description: string; version: string; endpoints: Record<string, string> }> {
    return this.request<{ name: string; description: string; version: string; endpoints: Record<string, string> }>('/api');
  }

  /**
   * Fetch links belonging to current authenticated user
   */
  public async getLinks(): Promise<LinkItem[]> {
    return this.request<LinkItem[]>('/api/links');
  }

  /**
   * Create a new shortened link via Express API
   */
  public async createLink(input: CreateLinkInput & { expiresAt?: string }): Promise<LinkItem> {
    return this.request<LinkItem>('/api/links', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Update a link destination, title, status, or expiry
   */
  public async updateLink(id: string, updates: UpdateLinkInput): Promise<LinkItem> {
    return this.request<LinkItem>(`/api/links/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete a link by ID via Express API
   */
  public async deleteLink(id: string): Promise<{ id: string; deleted: boolean }> {
    return this.request<{ id: string; deleted: boolean }>(`/api/links/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Fetch user aggregated overview analytics
   */
  public async getOverviewAnalytics(): Promise<OverviewAnalytics> {
    return this.request<OverviewAnalytics>('/api/analytics/overview');
  }

  /**
   * Fetch per-link detailed click analytics
   */
  public async getLinkAnalytics(linkId: string): Promise<LinkAnalytics> {
    return this.request<LinkAnalytics>(`/api/analytics/links/${linkId}`);
  }
}

export const apiClient = new ApiClient();
