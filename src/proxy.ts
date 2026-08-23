import { NextRequest, NextResponse } from "next/server";

const workHostname = "work.enby.fish";

export function proxy(request: NextRequest) {
  const hostname = (request.headers.get("host")?.split(":", 1)[0] || request.nextUrl.hostname).toLowerCase();

  if (hostname !== workHostname) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname === "/") {
    const destination = request.nextUrl.clone();
    destination.pathname = "/work";
    return NextResponse.rewrite(destination);
  }

  if (request.nextUrl.pathname === "/work") {
    const canonical = request.nextUrl.clone();
    canonical.pathname = "/";
    return NextResponse.redirect(canonical, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/work"],
};
