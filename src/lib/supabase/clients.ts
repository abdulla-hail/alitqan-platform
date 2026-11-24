import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/server-env";

/**
 * Session-aware client for the admin area and server actions. It carries the
 * signed-in user's JWT, so every query is filtered by Row Level Security.
 */
export async function createSessionClient(): Promise<SupabaseClient> {
  const store = await cookies();
  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // called from a Server Component: the proxy refreshes the session instead
        }
      },
    },
  });
}

/**
 * Anonymous, cookie-less client for public pages. Reads only what RLS exposes to
 * visitors (published content), and keeps public pages cacheable (ISR).
 */
let publicClient: SupabaseClient | null = null;
export function createPublicClient(): SupabaseClient {
  publicClient ??= createClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return publicClient;
}

/**
 * Service-role client: bypasses RLS. Used ONLY on the server for operations that
 * have already been validated/authorised in code (public form inserts after spam
 * checks, user administration via the Auth admin API, owner bootstrap).
 */
export function createServiceClient(): SupabaseClient {
  if (!serverEnv.serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return createClient(publicEnv.supabaseUrl, serverEnv.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
