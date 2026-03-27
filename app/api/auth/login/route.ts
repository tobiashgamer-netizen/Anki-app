import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createToken, sessionCookieOptions } from "@/lib/auth";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw3toPy62PmxV9Dhj91Vb0sNjU8TE0DvfOdltiSObumJ8tHJyYif8Iia394edBiPtg6/exec";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Brugernavn og adgangskode er påkrævet" },
        { status: 400 }
      );
    }

    // Fetch user from Google Sheets
    const res = await fetch(
      `${SCRIPT_URL}?action=getUser&username=${encodeURIComponent(username)}`,
      { redirect: "follow" }
    );
    const user = await res.json();

    if (!user || !user.username) {
      return NextResponse.json(
        { error: "Forkert brugernavn eller adgangskode" },
        { status: 401 }
      );
    }

    // Compare password with stored hash
    const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Forkert brugernavn eller adgangskode" },
        { status: 401 }
      );
    }

    // Create JWT
    const token = await createToken({
      bruger: user.username,
      rolle: user.role === "admin" ? "admin" : "bruger",
    });

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      bruger: user.username,
      rolle: user.role,
    });

    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch {
    return NextResponse.json(
      { error: "Der opstod en fejl. Prøv igen." },
      { status: 500 }
    );
  }
}
