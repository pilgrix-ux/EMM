import { NextResponse } from "next/server";

export function proxy(request) {
  const response = NextResponse.next({ request });

  // Saved workspaces are browser-specific and must never enter a shared cache.
  if (request.nextUrl.pathname.startsWith("/studio") || request.nextUrl.pathname.startsWith("/api/workspace")) {
    response.headers.set("Cache-Control", "private, no-store");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
