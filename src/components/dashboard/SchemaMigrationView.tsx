/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Database, Copy, Check, ShieldCheck, Terminal, FileText, CheckCircle2 } from 'lucide-react';

export function SchemaMigrationView() {
  const [activeSubTab, setActiveSubTab] = useState<'schema' | 'seed'>('schema');
  const [copied, setCopied] = useState(false);

  const schemaSql = `-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Links Table
CREATE TABLE IF NOT EXISTS public.links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_url TEXT NOT NULL,
    short_code VARCHAR(32) NOT NULL,
    title VARCHAR(255),
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ,
    click_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT chk_short_code_format CHECK (short_code ~ '^[a-zA-Z0-9_-]{3,32}$'),
    CONSTRAINT chk_url_length CHECK (char_length(original_url) <= 2048),
    CONSTRAINT chk_click_count_non_negative CHECK (click_count >= 0),
    CONSTRAINT chk_expiration_validity CHECK (expires_at IS NULL OR expires_at > created_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_links_short_code_unique ON public.links (short_code);
CREATE INDEX IF NOT EXISTS idx_links_user_id ON public.links (user_id);
CREATE INDEX IF NOT EXISTS idx_links_created_at_desc ON public.links (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_links_active_routing ON public.links (short_code, is_enabled, expires_at);

-- 3. Click Events Table
CREATE TABLE IF NOT EXISTS public.click_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    referrer TEXT,
    user_agent TEXT,
    ip_hash VARCHAR(64),
    country VARCHAR(64),
    city VARCHAR(64),
    device VARCHAR(32) DEFAULT 'desktop',
    browser VARCHAR(32),
    os VARCHAR(32)
);

CREATE INDEX IF NOT EXISTS idx_click_events_link_id ON public.click_events (link_id);
CREATE INDEX IF NOT EXISTS idx_click_events_timestamp_desc ON public.click_events (timestamp DESC);

-- 4. Triggers (updated_at and click_count increment)
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = timezone('utc'::text, now()); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_links_updated_at ON public.links;
CREATE TRIGGER trg_links_updated_at BEFORE UPDATE ON public.links FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_click_counter_increment() RETURNS TRIGGER AS $$
BEGIN UPDATE public.links SET click_count = click_count + 1 WHERE id = NEW.link_id; RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_click_events_increment_count ON public.click_events;
CREATE TRIGGER trg_click_events_increment_count AFTER INSERT ON public.click_events FOR EACH ROW EXECUTE FUNCTION public.handle_click_counter_increment();

-- 5. Row Level Security Policies
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own links" ON public.links FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own links" ON public.links FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own links" ON public.links FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own links" ON public.links FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners can select clicks for their links" ON public.click_events FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.links WHERE public.links.id = public.click_events.link_id AND public.links.user_id = auth.uid())
);`;

  const seedSql = `-- Development Seed Records
-- Users: 00000000-0000-0000-0000-000000000001 (Demo Engineer)
--        00000000-0000-0000-0000-000000000002 (Demo Collaborator)

INSERT INTO public.links (id, user_id, original_url, short_code, title, is_enabled, expires_at)
VALUES 
  ('11111111-1111-1111-1111-111111111101', '00000000-0000-0000-0000-000000000001', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview', 'mdn-http', 'MDN HTTP Protocol Reference', true, now() + interval '90 days'),
  ('11111111-1111-1111-1111-111111111102', '00000000-0000-0000-0000-000000000001', 'https://supabase.com/docs/guides/auth/server-side/creating-a-client', 'supa-auth', 'Supabase Server Auth Guide', true, now() + interval '60 days'),
  ('11111111-1111-1111-1111-111111111103', '00000000-0000-0000-0000-000000000001', 'https://vitest.dev/guide/', 'vitest-docs', 'Vitest Modern Testing Framework Guide', true, null),
  ('22222222-2222-2222-2222-222222222201', '00000000-0000-0000-0000-000000000002', 'https://github.com/expressjs/express', 'team-express', 'Teammate Private Project Link', true, now() + interval '30 days')
ON CONFLICT (id) DO NOTHING;`;

  const activeContent = activeSubTab === 'schema' ? schemaSql : seedSql;

  const copyCode = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="p-6 bg-white rounded-xl border border-slate-200">
        <h2 className="text-base font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-600" />
          <span>Supabase PostgreSQL Schema & Security Policies</span>
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          Production-grade database migration providing table definitions for <code className="font-mono text-slate-800">links</code> and <code className="font-mono text-slate-800">click_events</code>, complete with check constraints, foreign keys, cascade deletes, automated triggers, and Row Level Security (RLS) policies.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="font-semibold text-slate-900 block mb-1">Row Level Security</span>
            <span className="text-[11px] text-slate-500">
              Strict isolation: users can only SELECT, INSERT, UPDATE and DELETE their own records.
            </span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="font-semibold text-slate-900 block mb-1">Automated Triggers</span>
            <span className="text-[11px] text-slate-500">
              <code className="font-mono">updated_at</code> updates automatically, and new clicks increment <code className="font-mono">click_count</code>.
            </span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="font-semibold text-slate-900 block mb-1">Idempotent Execution</span>
            <span className="text-[11px] text-slate-500">
              Safe to run multiple times in migration pipelines and Supabase SQL Editor.
            </span>
          </div>
        </div>
      </div>

      {/* SQL Viewer Card */}
      <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-sm">
        <div className="px-6 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('schema')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeSubTab === 'schema'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Schema Migration (schema.sql)
            </button>
            <button
              onClick={() => setActiveSubTab('seed')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeSubTab === 'seed'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Demo Seed Script (seed.sql)
            </button>
          </div>

          <button
            onClick={copyCode}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied SQL</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy SQL</span>
              </>
            )}
          </button>
        </div>

        <div className="p-6 overflow-x-auto max-h-[500px] text-xs font-mono text-slate-200 leading-relaxed">
          <pre>{activeContent}</pre>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="p-6 bg-white rounded-xl border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Supabase Project Setup Instructions</span>
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 leading-relaxed">
          <li>Create a free PostgreSQL project at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline">supabase.com</a>.</li>
          <li>Navigate to the <strong>SQL Editor</strong> in your Supabase Dashboard.</li>
          <li>Click <strong>New query</strong>, paste the content of <code className="font-mono text-slate-800">scripts/schema.sql</code>, and click <strong>Run</strong>.</li>
          <li>(Optional) Run <code className="font-mono text-slate-800">scripts/seed.sql</code> to populate demo data.</li>
          <li>From <strong>Project Settings &gt; API</strong>, copy your <strong>Project URL</strong>, <strong>anon key</strong>, and <strong>service_role key</strong> into your local <code className="font-mono text-slate-800">.env</code>.</li>
        </ol>
      </div>
    </div>
  );
}
