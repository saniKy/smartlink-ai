/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Terminal, Copy, Check, FileCode, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export function DocumentationView() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const commands = [
    {
      id: 'install',
      title: '1. Install Dependencies',
      cmd: 'npm install',
      desc: 'Installs all runtime, dev, and testing dependencies (Express, Vitest, Supertest, Zod, Tailwind, etc.).',
    },
    {
      id: 'env',
      title: '2. Setup Environment Variables',
      cmd: 'cp .env.example .env',
      desc: 'Initializes your local environment with verified defaults and configuration slots.',
    },
    {
      id: 'dev',
      title: '3. Run Full-Stack Dev Server (Express + React Vite on port 3000)',
      cmd: 'npm run dev',
      desc: 'Boots Express API on port 3000 with Vite middleware mounted for seamless hot client development.',
    },
    {
      id: 'test',
      title: '4. Execute Backend Integration Tests',
      cmd: 'npm test',
      desc: 'Runs automated Vitest and Supertest test suites against Express routes and error middleware.',
    },
    {
      id: 'standalone',
      title: '5. Run Express API in Standalone Mode (Optional)',
      cmd: 'npm run dev:api',
      desc: 'Runs the Express API separately from Vite, ideal for independent backend testing or microservice deployment.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="p-6 bg-white rounded-xl border border-slate-200">
        <h2 className="text-base font-semibold text-slate-900 mb-1">
          SmartLink AI - Phase 1 Setup & Execution Guide
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          SmartLink AI is a production-oriented URL shortener with click analytics and security. This setup documentation outlines exact commands, communication mechanisms, and architectural guarantees established in Phase 1.
        </p>
      </div>

      {/* Commands Grid */}
      <div className="space-y-3">
        {commands.map((c) => (
          <div key={c.id} className="p-4 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-900">{c.title}</span>
              <button
                onClick={() => copyToClipboard(c.cmd, c.id)}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
                title="Copy command"
              >
                {copiedId === c.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-2.5 bg-slate-900 rounded-lg text-slate-100 font-mono text-xs flex items-center justify-between overflow-x-auto">
              <span>$ {c.cmd}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">{c.desc}</p>
          </div>
        ))}
      </div>

      {/* Client-Server Communication Explanation */}
      <div className="p-6 bg-white rounded-xl border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <FileCode className="w-4 h-4 text-indigo-600" />
          <span>Client-Server Communication Architecture</span>
        </h3>
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            <strong>1. Same-Origin & Proxy Layer:</strong> In development, the Express server in <code className="font-mono text-slate-800">server.ts</code> mounts the Express API under <code className="font-mono text-slate-800">/api/*</code> and Vite SPA dev middleware on port 3000. All client requests to <code className="font-mono text-slate-800">/api/*</code> route directly through Express without CORS friction.
          </p>
          <p>
            <strong>2. Standalone Deployment Option:</strong> When deployed separately (e.g. Render, Railway, Cloud Run), the React frontend uses the <code className="font-mono text-slate-800">VITE_API_BASE_URL</code> environment variable to target the Express backend, which enables pre-configured CORS headers.
          </p>
          <p>
            <strong>3. Shared Type Contract:</strong> All request payloads and response envelopes are strictly governed by <code className="font-mono text-slate-800">packages/shared/src/types/api.ts</code>, preventing payload drift and guaranteeing type safety across both frontend and backend.
          </p>
          <p>
            <strong>4. Independent JWT Token Verification:</strong> In Phase 2, the frontend acquires a session JWT token via Supabase Auth and passes it via standard <code className="font-mono text-slate-800">Authorization: Bearer &lt;token&gt;</code> headers. The Express API verifies the token cryptographically on every request rather than trusting client claims.
          </p>
        </div>
      </div>
    </div>
  );
}
