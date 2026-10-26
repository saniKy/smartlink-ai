-- ==============================================================================
-- SmartLink AI - Development Seed Data (scripts/seed.sql)
-- Clearly identified demonstration records for testing and local evaluation.
-- ==============================================================================

-- 1. Ensure Demo Users Exist in Supabase auth.users table
-- Note: In Supabase, auth.users holds user accounts.
-- These UUIDs are strictly reserved mock identities.
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud
) VALUES 
(
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'demo.engineer@smartlink.ai',
    crypt('DemoPassword2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Demo Senior Engineer"}',
    now(),
    now(),
    'authenticated',
    'authenticated'
),
(
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'collaborator@smartlink.ai',
    crypt('DemoPassword2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Demo Collaborator"}',
    now(),
    now(),
    'authenticated',
    'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Clear Existing Demo Data (Idempotent execution)
DELETE FROM public.click_events 
WHERE link_id IN (
    '11111111-1111-1111-1111-111111111101'::uuid,
    '11111111-1111-1111-1111-111111111102'::uuid,
    '11111111-1111-1111-1111-111111111103'::uuid,
    '11111111-1111-1111-1111-111111111104'::uuid,
    '22222222-2222-2222-2222-222222222201'::uuid
);

DELETE FROM public.links 
WHERE id IN (
    '11111111-1111-1111-1111-111111111101'::uuid,
    '11111111-1111-1111-1111-111111111102'::uuid,
    '11111111-1111-1111-1111-111111111103'::uuid,
    '11111111-1111-1111-1111-111111111104'::uuid,
    '22222222-2222-2222-2222-222222222201'::uuid
);

-- 3. Insert Demo Links
INSERT INTO public.links (
    id,
    user_id,
    original_url,
    short_code,
    title,
    is_enabled,
    expires_at,
    click_count,
    created_at
) VALUES 
(
    '11111111-1111-1111-1111-111111111101'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview',
    'mdn-http',
    'MDN HTTP Protocol Reference & Status Codes',
    true,
    now() + interval '90 days',
    0,
    now() - interval '5 days'
),
(
    '11111111-1111-1111-1111-111111111102'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'https://supabase.com/docs/guides/auth/server-side/creating-a-client',
    'supa-auth',
    'Supabase Server-Side Auth Guide',
    true,
    now() + interval '60 days',
    0,
    now() - interval '3 days'
),
(
    '11111111-1111-1111-1111-111111111103'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'https://vitest.dev/guide/',
    'vitest-docs',
    'Vitest Modern Testing Framework Guide',
    true,
    null,
    0,
    now() - interval '1 day'
),
(
    '11111111-1111-1111-1111-111111111104'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'https://example.com/expired-campaign-page',
    'flash-sale-2025',
    'Flash Sale Campaign [Expired Test]',
    false,
    now() - interval '2 days',
    0,
    now() - interval '10 days'
),
-- Teammate's Link (To verify User A cannot see User B's links)
(
    '22222222-2222-2222-2222-222222222201'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    'https://github.com/expressjs/express',
    'team-express',
    'Teammate Private Project Link',
    true,
    now() + interval '30 days',
    0,
    now() - interval '2 days'
);

-- 4. Insert Demo Click Events
-- Triggers will automatically increment click_count on public.links!
INSERT INTO public.click_events (
    link_id,
    timestamp,
    referrer,
    user_agent,
    ip_hash,
    country,
    city,
    device,
    browser,
    os
) VALUES 
('11111111-1111-1111-1111-111111111101'::uuid, now() - interval '4 days', 'https://twitter.com', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'hash_demo_ip_01', 'United States', 'San Francisco', 'mobile', 'Safari', 'iOS'),
('11111111-1111-1111-1111-111111111101'::uuid, now() - interval '3 days', 'https://linkedin.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'hash_demo_ip_02', 'United States', 'New York', 'desktop', 'Chrome', 'macOS'),
('11111111-1111-1111-1111-111111111101'::uuid, now() - interval '2 days', 'https://github.com', 'Mozilla/5.0 (X11; Linux x86_64)', 'hash_demo_ip_03', 'Germany', 'Berlin', 'desktop', 'Firefox', 'Linux'),
('11111111-1111-1111-1111-111111111101'::uuid, now() - interval '1 day', 'Direct', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'hash_demo_ip_04', 'United Kingdom', 'London', 'desktop', 'Edge', 'Windows'),
('11111111-1111-1111-1111-111111111101'::uuid, now() - interval '2 hours', 'https://news.ycombinator.com', 'Mozilla/5.0 (iPad; CPU OS 16_5)', 'hash_demo_ip_05', 'Canada', 'Toronto', 'tablet', 'Safari', 'iPadOS'),

('11111111-1111-1111-1111-111111111102'::uuid, now() - interval '2 days', 'https://google.com', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)', 'hash_demo_ip_06', 'United States', 'Seattle', 'desktop', 'Chrome', 'macOS'),
('11111111-1111-1111-1111-111111111102'::uuid, now() - interval '1 day', 'https://reddit.com', 'Mozilla/5.0 (Android 14; Mobile)', 'hash_demo_ip_07', 'India', 'Bengaluru', 'mobile', 'Chrome', 'Android'),

('11111111-1111-1111-1111-111111111103'::uuid, now() - interval '5 hours', 'https://github.com', 'Mozilla/5.0 (Windows NT 10.0)', 'hash_demo_ip_08', 'Japan', 'Tokyo', 'desktop', 'Chrome', 'Windows');
