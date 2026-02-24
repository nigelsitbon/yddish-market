import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Lazy-initialized Supabase admin client.
 * Prevents module-level crashes if env vars are missing at import time.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
    if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    _supabaseAdmin = createClient(url, key);
  }
  return _supabaseAdmin;
}

/** Backwards-compatible export — proxied to lazy init */
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdmin() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
