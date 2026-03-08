import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

const publicPaths = ["/login", "/register", "/api/auth", "/api/v1", "/api-docs"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));

  if (!req.auth && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (req.auth && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
