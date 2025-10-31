// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_KEY || "";

if (!supabaseUrl || !serviceKey) {
  // In dev, it's helpful to log; production should ensure env vars present.
  // But do not throw — routes should handle missing keys gracefully.
  // console.warn("Supabase keys not found; uploads will fallback to base64 (dev)");
}

export const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});
