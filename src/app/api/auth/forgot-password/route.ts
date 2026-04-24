import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

const INTERNAL = /localhost|127\.0\.0\.1|0\.0\.0\.0/;
const SITE_BASE_URL = (() => {
  for (const v of [process.env.SITE_URL, process.env.RENDER_EXTERNAL_URL, process.env.NEXTAUTH_URL]) {
    if (v && !INTERNAL.test(v)) return v.replace(/\/$/, "");
  }
  return "https://live-party-game.onrender.com";
})();

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    // Generate a secure reset token valid for 1 hour
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    // Use "reset:email" prefix to distinguish from email verification tokens
    const identifier = `reset:${email}`;

    // Remove any existing reset tokens for this email
    await db.verificationToken.deleteMany({ where: { identifier } });

    await db.verificationToken.create({
      data: { identifier, token, expires },
    });

    console.log("[ForgotPassword] Using baseUrl:", SITE_BASE_URL);
    await sendPasswordResetEmail(email, token, SITE_BASE_URL);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[ForgotPassword] Error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
