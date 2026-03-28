import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionFromHeader } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromHeader(req) || await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    bruger: session.bruger,
    rolle: session.rolle,
  });
}
