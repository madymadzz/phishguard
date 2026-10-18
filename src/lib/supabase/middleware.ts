import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Static assets and internal routes bypass
  if (
    path.startsWith("/_next") ||
    path.startsWith("/api/auth") ||
    path.startsWith("/icons") ||
    path.startsWith("/brand") ||
    path === "/manifest.json" ||
    path === "/favicon.ico"
  ) {
    return supabaseResponse;
  }

  // If user is logged in, fetch profile status and role
  let userProfile: { role: string; status: string } | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .maybeSingle();

    userProfile = profile;

    // Check if account is suspended
    if (userProfile?.status === "suspended") {
      await supabase.auth.signOut();
      const redirectUrl = new URL("/login?error=suspended", request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Define route classifications
  const isAuthRoute =
    path === "/login" ||
    path === "/signup" ||
    path === "/forgot-password" ||
    path === "/verify-email";

  const isAdminRoute = path.startsWith("/admin");
  const isAppRoute =
    path === "/home" ||
    path.startsWith("/scan") ||
    path === "/history" ||
    path.startsWith("/learn") ||
    path === "/about" ||
    path === "/profile";

  // Check Maintenance Mode (if enabled, non-admins cannot access app routes)
  if (!path.startsWith("/maintenance") && !path.startsWith("/api")) {
    const { data: maintenanceSetting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .maybeSingle();

    const isMaintenance = maintenanceSetting?.value === true;
    if (isMaintenance && userProfile?.role !== "admin") {
      return NextResponse.redirect(new URL("/maintenance", request.url));
    }
  }

  // Splash route logic: root '/'
  if (path === "/") {
    if (user) {
      return NextResponse.redirect(new URL("/home", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // If authenticated user tries to access auth routes, redirect to /home
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // If unauthenticated user tries to access protected app routes or admin routes
  if ((isAppRoute || isAdminRoute) && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", path);
    return NextResponse.redirect(redirectUrl);
  }

  // If non-admin tries to access /admin routes
  if (isAdminRoute && userProfile?.role !== "admin") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return supabaseResponse;
}
