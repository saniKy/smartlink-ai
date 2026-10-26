/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runSeed() {
  console.log('----------------------------------------------------');
  console.log('SmartLink AI - Development Database Seeder');
  console.log('----------------------------------------------------');

  const seedSqlPath = path.resolve(process.cwd(), 'scripts/seed.sql');
  const seedSql = fs.readFileSync(seedSqlPath, 'utf8');

  if (!supabaseUrl || !supabaseServiceRoleKey || supabaseServiceRoleKey.includes('placeholder')) {
    console.log('ℹ️  No live Supabase credentials detected in .env.');
    console.log('   To seed your live Supabase database:');
    console.log('   1. Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    console.log('   2. OR copy and paste scripts/seed.sql directly into your Supabase Dashboard SQL Editor.');
    console.log('');
    console.log('✅ Demo seed SQL generated at: scripts/seed.sql');
    return;
  }

  console.log(`Connecting to Supabase at ${supabaseUrl}...`);
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    // If pg connection or RPC available, we can execute or insert demo records
    console.log('Executing seed data script against Supabase instance...');
    // Demo records can be upserted using the Supabase client
    const demoUserId = '00000000-0000-0000-0000-000000000001';
    
    const { error: linkError } = await supabase.from('links').upsert([
      {
        id: '11111111-1111-1111-1111-111111111101',
        user_id: demoUserId,
        original_url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview',
        short_code: 'mdn-http',
        title: 'MDN HTTP Protocol Reference & Status Codes',
        is_enabled: true,
        expires_at: new Date(Date.now() + 90 * 86400000).toISOString(),
      },
      {
        id: '11111111-1111-1111-1111-111111111102',
        user_id: demoUserId,
        original_url: 'https://supabase.com/docs/guides/auth/server-side/creating-a-client',
        short_code: 'supa-auth',
        title: 'Supabase Server-Side Auth Guide',
        is_enabled: true,
        expires_at: new Date(Date.now() + 60 * 86400000).toISOString(),
      },
      {
        id: '11111111-1111-1111-1111-111111111103',
        user_id: demoUserId,
        original_url: 'https://vitest.dev/guide/',
        short_code: 'vitest-docs',
        title: 'Vitest Modern Testing Framework Guide',
        is_enabled: true,
      },
    ]);

    if (linkError) {
      console.warn(`[Seed Note] Direct REST upsert: ${linkError.message}`);
      console.log('Tip: Run scripts/schema.sql and scripts/seed.sql in Supabase Dashboard SQL Editor.');
    } else {
      console.log('✅ Demo links successfully seeded into Supabase.');
    }
  } catch (err) {
    console.error('Seed execution error:', err);
  }
}

runSeed();
