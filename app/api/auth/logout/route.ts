import { NextResponse } from "next/server";
import { COOKIE_DELETE } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_DELETE);
  return response;
}
