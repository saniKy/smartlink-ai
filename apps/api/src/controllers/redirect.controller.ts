/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Request, Response } from 'express';
import { supabaseService } from '../services/supabase.ts';
import { UAParser } from 'ua-parser-js';
import crypto from 'crypto';

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip + '_smartlink_salt').digest('hex').substring(0, 32);
}

function cleanReferrer(referrerHeader?: string): string {
  if (!referrerHeader || !referrerHeader.trim()) return 'Direct';
  try {
    // If it's a full URL, extract the canonical domain (e.g., twitter.com, linkedin.com)
    const url = new URL(referrerHeader);
    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    // If not a parseable URL, sanitize length
    return referrerHeader.trim().substring(0, 80);
  }
}

function parseUserAgentInfo(userAgent?: string): { device: string; browser: string; os: string } {
  if (!userAgent || !userAgent.trim()) {
    return { device: 'desktop', browser: 'Unknown', os: 'Unknown' };
  }

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  // Normalize device type: mobile, tablet, desktop, or other
  let device = 'desktop';
  if (result.device.type === 'mobile') device = 'mobile';
  else if (result.device.type === 'tablet') device = 'tablet';
  else if (result.device.type) device = result.device.type;

  const browser = result.browser.name || 'Unknown';
  const os = result.os.name || 'Unknown';

  return { device, browser, os };
}

function renderErrorPage(title: string, heading: string, message: string, code: string, statusCode: number): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - SmartLink AI</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; box-sizing: border-box; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 2.5rem; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
    .code { font-family: ui-monospace, monospace; font-size: 0.75rem; color: #94a3b8; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em; }
    h1 { font-size: 1.25rem; font-weight: 700; margin: 0 0 0.75rem; color: #ffffff; }
    p { font-size: 0.875rem; line-height: 1.6; color: #cbd5e1; margin: 0 0 1.5rem; }
    a { display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; font-size: 0.8125rem; font-weight: 600; padding: 0.625rem 1.25rem; border-radius: 8px; transition: background 0.15s; }
    a:hover { background: #4338ca; }
  </style>
</head>
<body>
  <div class="card">
    <div class="code">HTTP ${statusCode} · ${code}</div>
    <h1>${heading}</h1>
    <p>${message}</p>
    <a href="/">Go to SmartLink AI Dashboard</a>
  </div>
</body>
</html>`;
}

export class RedirectController {
  public async handleRedirect(req: Request, res: Response): Promise<void> {
    const { code } = req.params;

    if (!code) {
      res.status(404).send(renderErrorPage('Link Not Found', 'Missing Short Code', 'No short code was provided in the URL path.', 'NOT_FOUND', 404));
      return;
    }

    try {
      // 1. Fast active link resolution
      const resolution = await supabaseService.resolveLinkStatus(code);

      if (resolution.status === 'not_found') {
        res.status(404).send(
          renderErrorPage(
            'Link Not Found',
            'Short Link Not Found',
            `The requested short link <strong>/s/${encodeURIComponent(code)}</strong> does not exist or has been removed.`,
            'NOT_FOUND',
            404
          )
        );
        return;
      }

      if (resolution.status === 'disabled') {
        res.status(410).send(
          renderErrorPage(
            'Link Disabled',
            'Link Deactivated by Owner',
            `The short link <strong>/s/${encodeURIComponent(code)}</strong> has been deactivated by its owner.`,
            'LINK_DISABLED',
            410
          )
        );
        return;
      }

      if (resolution.status === 'expired') {
        const expiryDate = resolution.link.expiresAt ? new Date(resolution.link.expiresAt).toLocaleDateString() : '';
        res.status(410).send(
          renderErrorPage(
            'Link Expired',
            'Link Expired',
            `The short link <strong>/s/${encodeURIComponent(code)}</strong> expired on ${expiryDate} and is no longer accepting redirects.`,
            'LINK_EXPIRED',
            410
          )
        );
        return;
      }

      // 2. High performance redirect: issue 302 IMMEDIATELY (no waiting for telemetry)
      res.redirect(302, resolution.destinationUrl);

      // 3. Asynchronously record click telemetry with ua-parser-js
      const rawUserAgent = req.get('user-agent');
      const rawReferrer = req.get('referrer') || req.get('referer');
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

      const { device, browser, os } = parseUserAgentInfo(rawUserAgent);
      const referrer = cleanReferrer(rawReferrer);
      const ipHash = hashIp(clientIp);

      supabaseService
        .recordClick(resolution.link.id, {
          referrer,
          userAgent: rawUserAgent,
          ipHash,
          device,
          browser,
          os,
        })
        .catch((err) => {
          console.error(`[Async Click Logger Error for link ${resolution.link.id}]`, err);
        });
    } catch (err) {
      console.error('[Redirect Controller Error]', err);
      res.status(500).send('Internal Server Error during URL redirection');
    }
  }
}

export const redirectController = new RedirectController();
