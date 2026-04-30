import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Set them in .env.local (locally) and in your Vercel project env."
  );
}

// All app tables live in the `marketing_calendar` schema (not `public`)
// so this app coexists with other apps in the same Supabase project.
// The schema must also be added to "Exposed schemas" in
// Supabase → Project Settings → API for PostgREST to see it.
export const SCHEMA = "marketing_calendar";

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
  db: { schema: SCHEMA },
});

export type Row = Record<string, unknown>;
