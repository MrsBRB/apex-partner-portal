import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase auth session cookie on every request that matches
// the middleware config below. Without this, a signed-in session can go
// stale mid-visit (Supabase access tokens are short-lived and are normally
// refreshed here) and users intermittently appear logged out even though
// they signed in successfully. This mirrors Supabase's own reference
// implementation for Next.js App Router SSR apps.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not add logic between createServerClient and getUser(). Skipping
  // this call, or reordering it, is the single most common way this kind
  // of middleware silently stops refreshing sessions.
  await supabase.auth.getUser();

  return supabaseResponse;
}
