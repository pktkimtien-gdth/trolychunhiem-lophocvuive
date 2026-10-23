import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://nxudttehbzasluegzbpa.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_mRKReSdV30tSTQOS8bLyMA_w33W8dJm';

export interface SupabaseLink {
  id?: string | number;
  title: string;
  url: string;
  description?: string;
  category?: string;
  created_at?: string;
  icon?: string;
  target?: string;
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export default supabase;
