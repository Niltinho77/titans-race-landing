import { NextResponse } from "next/server";
import {
  PORTAL_SESSION_COOKIE,
  deleteCurrentSession,
} from "@/lib/portalAuth";

export const runtime = "nodejs";

export async function POST() {
  await deleteCurrentSession();

  const res = NextResponse.json({ ok: true });
  res.cookies.set(PORTAL_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return res;
}
