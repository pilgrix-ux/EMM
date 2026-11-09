import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let browserClient;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("The private video upload service is not configured.");
  }

  if (!browserClient) {
    browserClient = createSupabaseClient(url, publishableKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }

  return browserClient;
}
