import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Hard fail early if misconfigured
if (!url) {
  console.error('NEXT_PUBLIC_SUPABASE_URL is missing');
}
if (!anon) {
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
}

// Export a singleton client for the browser
export const supabase = createClient(url ?? '', anon ?? '');
