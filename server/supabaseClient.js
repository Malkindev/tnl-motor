import { createClient } from '@supabase/supabase-js';

// Prefer server env names. Fall back to VITE_ vars if present (for local dev setups).
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('SUPABASE service envs missing. Server Supabase client may not work. Expected SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
