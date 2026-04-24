import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Name, email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with emailVerified = null (unverified)
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: null,
      },
    });

    // Generate a secure verification token (24h expiry)
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Store token in VerificationToken table
    await db.verificationToken.create({
      data: { identifier: email, token, expires },
    });

    // Send verification email via Resend
    // RENDER_EXTERNAL_URL is auto-injected by Render (e.g. https://live-party-game.onrender.com)
    const baseUrl =
      process.env.RENDER_EXTERNAL_URL ??
      process.env.NEXTAUTH_URL ??
      `${req.headers.get("x-forwarded-proto") ?? "https"}://${req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000"}`;
    await sendVerificationEmail(email, token, baseUrl);

    return NextResponse.json(
      { ok: true, userId: user.id, message: "Please check your email to verify your account." },
      { status: 201 }
    );
  } catch (err) {
    console.error("[Signup] Error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
