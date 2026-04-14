import { createClient } from '@supabase/supabase-js'


// specific database instance
// these values are loaded from Vite environment variables defined
// in a .env.local (or .env) file at the project root.  Vite only exposes
// variables prefixed with `VITE_` to the client bundle.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// client side app communication (rls activated)
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)