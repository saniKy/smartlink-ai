-- ==============================================================================
-- SmartLink AI - Schema Definition File
-- Convenient single-file SQL script for execution in Supabase Dashboard SQL Editor
-- ==============================================================================

-- 1. Enable UUID Extension if not already active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Links Table
-- ==============================================================================
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

    -- Constraints
    CONSTRAINT chk_short_code_format CHECK (short_code ~ '^[a-zA-Z0-9_-]{3,32}$'),
    CONSTRAINT chk_url_length CHECK (char_length(original_url) <= 2048),
    CONSTRAINT chk_click_count_non_negative CHECK (click_count >= 0),
    CONSTRAINT chk_expiration_validity CHECK (expires_at IS NULL OR expires_at > created_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_links_short_code_unique ON public.links (short_code);
CREATE INDEX IF NOT EXISTS idx_links_user_id ON public.links (user_id);
CREATE INDEX IF NOT EXISTS idx_links_created_at_desc ON public.links (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_links_active_routing ON public.links (short_code, is_enabled, expires_at);

-- ==============================================================================
-- 3. Click Events Table
-- ==============================================================================
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
CREATE INDEX IF NOT EXISTS idx_click_events_link_timestamp ON public.click_events (link_id, timestamp DESC);

-- ==============================================================================
-- 4. Automatic Triggers
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_links_updated_at ON public.links;
CREATE TRIGGER trg_links_updated_at
    BEFORE UPDATE ON public.links
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_click_counter_increment()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.links
    SET click_count = click_count + 1
    WHERE id = NEW.link_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_click_events_increment_count ON public.click_events;
CREATE TRIGGER trg_click_events_increment_count
    AFTER INSERT ON public.click_events
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_click_counter_increment();

-- ==============================================================================
-- 5. Row Level Security Policies
-- ==============================================================================
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'links' AND policyname = 'Users can select own links') THEN
        CREATE POLICY "Users can select own links" ON public.links FOR SELECT TO authenticated USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'links' AND policyname = 'Users can insert own links') THEN
        CREATE POLICY "Users can insert own links" ON public.links FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'links' AND policyname = 'Users can update own links') THEN
        CREATE POLICY "Users can update own links" ON public.links FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'links' AND policyname = 'Users can delete own links') THEN
        CREATE POLICY "Users can delete own links" ON public.links FOR DELETE TO authenticated USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'click_events' AND policyname = 'Owners can select clicks for their links') THEN
        CREATE POLICY "Owners can select clicks for their links" ON public.click_events FOR SELECT TO authenticated USING (
            EXISTS (SELECT 1 FROM public.links WHERE public.links.id = public.click_events.link_id AND public.links.user_id = auth.uid())
        );
    END IF;
END $$;

GRANT ALL ON public.links TO authenticated, service_role;
GRANT ALL ON public.click_events TO authenticated, service_role;
