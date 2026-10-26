/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.ts';

describe('SmartLink AI API - Health & System Endpoints', () => {
  it('GET /api/health should return 200 with healthy status and metadata', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');

    const { data } = response.body;
    expect(data.status).toBe('healthy');
    expect(data.service).toBe('smartlink-ai-api');
    expect(data.version).toBe('1.2.0-phase2');
    expect(typeof data.uptimeSeconds).toBe('number');
    expect(data.checks).toHaveProperty('api', 'ok');
    expect(data.checks).toHaveProperty('database');
    expect(data.checks).toHaveProperty('auth');
  });

  it('GET /api should return API root metadata', async () => {
    const response = await request(app).get('/api');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('SmartLink AI Backend API');
    expect(response.body.data.endpoints.health).toBe('/api/health');
  });

  it('GET /api/unknown-endpoint should return 404 or fall through gracefully', async () => {
    const response = await request(app).get('/api/non-existent-route');
    expect([404, 200]).toContain(response.status);
  });
});
