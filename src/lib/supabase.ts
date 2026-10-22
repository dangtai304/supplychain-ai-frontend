import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

/** Null when Supabase isn't configured: the app then runs open, in demo mode (e.g. the shareable preview). */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;

export const authEnabled = Boolean(supabase);

// Capture the link type before supabase-js consumes the URL hash: invite and recovery links
// must land on "set your password" rather than straight into the app.
const hashParams = new URLSearchParams(typeof window !== "undefined" ? window.location.hash.slice(1) : "");
const queryType = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("type") : null;
export const arrivedVia: "invite" | "recovery" | null = ((): "invite" | "recovery" | null => {
  const t = hashParams.get("type") ?? queryType;
  return t === "invite" || t === "recovery" ? t : null;
})();

export async function accessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
