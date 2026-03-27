import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "anki-pro-secret-key-change-in-production"
);

const PUBLIC_ROUTES = ["/login", "/dashboard", "/api/auth/login", "/api/auth/register"];

async function getSessionFromCookie(req: NextRequest) {
  const token = req.cookies.get("anki-session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { bruger: string; rolle: string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public assets, Next.js internals, and API auth routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/api/auth/")
  ) {
    return NextResponse.next();
  }

  // Allow public routes without auth
  if (PUBLIC_ROUTES.includes(pathname)) {
    const session = await getSessionFromCookie(req);
    // If already logged in and visiting login page, redirect to landing-page
    if (session && (pathname === "/login" || pathname === "/dashboard")) {
      return NextResponse.redirect(new URL("/landing-page", req.url));
    }
    return NextResponse.next();
  }

  // All other routes require authentication
  const session = await getSessionFromCookie(req);

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Admin route protection
  if (pathname === "/admin" && session.rolle !== "admin") {
    return NextResponse.redirect(new URL("/landing-page", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
