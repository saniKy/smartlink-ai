/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Link2, Sparkles, Lock, ArrowUpRight, Copy, Check } from 'lucide-react';

export function QuickLinkPreview() {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const sampleLinks = [
    {
      original: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview',
      short: 'https://smartlink.ai/s/http-docs',
      clicks: 142,
      created: '2026-10-25',
    },
    {
      original: 'https://supabase.com/docs/guides/auth/server-side/creating-a-client',
      short: 'https://smartlink.ai/s/supa-auth',
      clicks: 89,
      created: '2026-10-26',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Shorten Input Preview */}
      <div className="p-6 bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-indigo-600" />
            <span>Shorten New URL</span>
          </h3>
          <span className="text-xs font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
            Phase 2 Scope
          </span>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          According to Architecture Rule #1 & #2, link shortening business logic, hash collisions, and database writes are strictly owned by the Express API, never executed directly in browser code.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Destination URL
            </label>
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/very/long/destination/url..."
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Requires Supabase User Authentication</span>
            </div>
            <button
              disabled
              className="px-4 py-2 text-xs font-medium text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed border border-slate-200"
              title="Will be enabled when Express link creation API is implemented in Phase 2"
            >
              Shorten URL (Phase 2)
            </button>
          </div>
        </div>
      </div>

      {/* Sample Links Table Preview */}
      <div className="p-6 bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Link Management Data Structure Preview
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Conforms to shared typed contract <code className="font-mono text-slate-700">packages/shared/src/types/link.ts</code>
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-2.5 font-medium">Short URL</th>
                <th className="pb-2.5 font-medium">Destination</th>
                <th className="pb-2.5 font-medium text-right">Clicks</th>
                <th className="pb-2.5 font-medium text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sampleLinks.map((link, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 font-mono font-medium text-indigo-600">
                    <div className="flex items-center gap-1.5">
                      <span>{link.short}</span>
                      <ArrowUpRight className="w-3 h-3 text-slate-400" />
                    </div>
                  </td>
                  <td className="py-3 font-mono text-slate-500 max-w-xs truncate">
                    {link.original}
                  </td>
                  <td className="py-3 font-mono text-right tabular-nums text-slate-900">
                    {link.clicks}
                  </td>
                  <td className="py-3 font-mono text-right tabular-nums text-slate-500">
                    {link.created}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
