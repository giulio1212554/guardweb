import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyDemoToken, getDemoCookieName } from "@/lib/demo";
import { isDevMode } from "@/lib/env";

const PROTECTED = ["/dashboard", "/admin", "/reports", "/onboarding"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/dev-login") && !isDevMode()) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const demoCookie = request.cookies.get(getDemoCookieName())?.value;
  if (demoCookie) {
    const session = await verifyDemoToken(demoCookie);
    if (session && session.scansLeft >= 0) return NextResponse.next();
  }
  const devSession = request.cookies.get("gw_dev_session")?.value;
  if (devSession && isDevMode()) return NextResponse.next();
  const sbAccess = request.cookies.get("sb-access-token")?.value;
  if (sbAccess) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/pricing";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/dev-login", "/reports/:path*", "/onboarding"],
};
