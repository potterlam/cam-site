import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/email";

const INTERNAL_HOST = /localhost|127\.0\.0\.1|0\.0\.0\.0/;

function getSiteUrl(req: NextRequest): string {
  // Check env vars but skip any that contain localhost (can be auto-set by Next.js internally)
  for (const v of [process.env.SITE_URL, process.env.RENDER_EXTERNAL_URL, process.env.NEXTAUTH_URL]) {
    if (v && !INTERNAL_HOST.test(v)) return v.replace(/\/$/, "");
  }
  // Try request headers
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  if (host && !INTERNAL_HOST.test(host)) return `${proto}://${host}`;
  // Hard fallback — emails must never contain localhost
  return "https://live-party-game.onrender.com";
}

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
      // Account exists but not verified — resend verification instead of 409
      if (!existing.emailVerified) {
        await db.verificationToken.deleteMany({ where: { identifier: email } });
        const token = randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await db.verificationToken.create({ data: { identifier: email, token, expires } });
        const baseUrl = getSiteUrl(req);
        console.log("[Signup/Resend] Using baseUrl:", baseUrl);
        let emailSent = true;
        try { await sendVerificationEmail(email, token, baseUrl); } catch { emailSent = false; }
        return NextResponse.json(
          { ok: true, userId: existing.id, emailSent, resent: true },
          { status: 200 }
        );
      }
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Step 1: Create user
    const user = await db.user.create({
      data: { name, email, password: hashedPassword, emailVerified: null },
    });

    // Step 2: Generate token
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.verificationToken.create({
      data: { identifier: email, token, expires },
    });

    // Step 3: Try to send email — failure does NOT block account creation
    const baseUrl = getSiteUrl(req);
    console.log("[Signup] Using baseUrl:", baseUrl);
    let emailSent = true;
    try {
      await sendVerificationEmail(email, token, baseUrl);
    } catch (emailErr) {
      emailSent = false;
      console.error("[Signup] Email send failed (account still created):", emailErr);
    }

    return NextResponse.json(
      { ok: true, userId: user.id, emailSent },
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
