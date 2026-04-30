import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
      "Set them in .env.local (locally) and in Vercel project env (production)."
  );
}

export const SCHEMA = "marketing_calendar";

// Server-only Supabase client. Uses the service role key, so NEVER
// import from a Client Component or anywhere bundled to the browser.
// All app data access goes through `app/api/*` route handlers.
export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: SCHEMA },
});
