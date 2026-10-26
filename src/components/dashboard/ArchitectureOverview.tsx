/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shield, Database, Cpu, GitCommit, Check, ArrowRight } from 'lucide-react';

export function ArchitectureOverview() {
  const phases = [
    {
      phase: 'Phase 1',
      title: 'Project Skeleton & Health API',
      status: 'Completed',
      desc: 'Express API setup, Zod env validation, /api/health endpoint, typed shared contracts, Vitest/Supertest test suite, responsive layout.',
      active: true,
    },
    {
      phase: 'Phase 2',
      title: 'Supabase Auth & Link Management',
      status: 'Upcoming',
      desc: 'Independent backend JWT verification, PostgreSQL schema, authenticated POST /api/links, URL redirection engine, collision resolution.',
      active: false,
    },
    {
      phase: 'Phase 3',
      title: 'Click Telemetry & Recharts Analytics',
      status: 'Upcoming',
      desc: 'Express-owned click tracking, referrer extraction, geo-location, user-agent parsing, daily trends, device distribution charts.',
      active: false,
    },
    {
      phase: 'Phase 4',
      title: 'Smart AI Enhancements & Final Polish',
      status: 'Upcoming',
      desc: 'Slug suggestion, title summarization, URL safety scan, comprehensive regression testing, documentation finalize.',
      active: false,
    },
  ];

  const architectureRules = [
    {
      title: 'API Business Logic Ownership',
      detail: 'Express API handles URL generation, database persistence, redirect counting, and authentication checks. The React frontend never writes directly to PostgreSQL.',
    },
    {
      title: 'Separation of Concerns',
      detail: 'Clear boundaries between apps/api (Node.js/Express) and src (React SPA), sharing contract definitions from packages/shared.',
    },
    {
      title: 'Security & Secret Isolation',
      detail: 'SUPABASE_SERVICE_ROLE_KEY and SUPABASE_JWT_SECRET exist strictly on the backend. The frontend only accesses public anon keys and verified API endpoints.',
    },
    {
      title: 'Strict Server-Side Validation',
      detail: 'Zod validates incoming environment variables and API payloads before execution, preventing injection or malformed data.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Architecture Principles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {architectureRules.map((rule, idx) => (
          <div key={idx} className="p-5 rounded-xl bg-white border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">{rule.title}</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {rule.detail}
            </p>
          </div>
        ))}
      </div>

      {/* Communication Flow Diagram */}
      <div className="p-5 rounded-xl bg-white border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">
          Client-Server Communication Pipeline
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          How the frontend React app communicates with the Express Node.js backend.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center text-xs">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              <span>React Client (`src/api/client.ts`)</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Sends typed requests with Bearer JWT tokens to <code className="font-mono text-slate-700">/api/*</code>.
            </p>
          </div>

          <div className="flex justify-center text-slate-400">
            <ArrowRight className="w-5 h-5 hidden md:block" />
            <span className="md:hidden">↓</span>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>Express API (`apps/api/src/app.ts`)</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Verifies tokens independently, validates inputs with Zod, executes business logic.
            </p>
          </div>
        </div>
      </div>

      {/* Phased Roadmap */}
      <div className="p-5 rounded-xl bg-white border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Implementation Roadmap (Deadline: October 29, 2026)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Disciplined commit-sized implementation phases prioritizing correctness and security.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {phases.map((p, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                p.active
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-slate-50/50 border-slate-200/80'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    p.active
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {p.active ? <Check className="w-3 h-3" /> : <GitCommit className="w-3 h-3" />}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    <span>{p.phase}: {p.title}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        p.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
