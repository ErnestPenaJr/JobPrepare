import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function ensureSidCookie(req: NextRequest, res: NextResponse){
  const sid = req.cookies.get('sid')?.value;
  if (!sid) {
    // Simple random sid
    const rnd = Math.random().toString(36).slice(2) + Date.now().toString(36);
    res.cookies.set('sid', rnd, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/") {
    const saw = req.cookies.get("saw_landing")?.value;
    if (!saw) {
      const url = req.nextUrl.clone();
      url.pathname = "/landing";
      const res = NextResponse.redirect(url);
      res.cookies.set("saw_landing", "1", { path: "/", maxAge: 60 * 60 * 24 * 365 });
      ensureSidCookie(req, res);
      return res;
    }
  }
  const res = NextResponse.next();
  ensureSidCookie(req, res);
  return res;
}

export const config = {
  matcher: ["/(.*)"],
};
