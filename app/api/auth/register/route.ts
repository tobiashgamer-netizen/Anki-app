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

    if (username.length < 2 || username.length > 30) {
      return NextResponse.json(
        { error: "Brugernavn skal være mellem 2 og 30 tegn" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Adgangskode skal være mindst 6 tegn" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const checkRes = await fetch(
      `${SCRIPT_URL}?action=getUser&username=${encodeURIComponent(username)}`,
      { redirect: "follow" }
    );
    const existing = await checkRes.json();

    if (existing && existing.username) {
      return NextResponse.json(
        { error: "Brugernavnet er allerede taget" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Register user in Google Sheets
    const registerRes = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "registerUser",
        username,
        hashedPassword,
        role: "bruger",
      }),
      redirect: "follow",
    });
    const registerResult = await registerRes.json();

    if (!registerResult.success) {
      return NextResponse.json(
        { error: "Kunne ikke oprette bruger. Prøv igen." },
        { status: 500 }
      );
    }

    // Auto-login: create JWT
    const token = await createToken({
      bruger: username,
      rolle: "bruger",
    });

    const response = NextResponse.json({
      success: true,
      bruger: username,
      rolle: "bruger",
      token,
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
