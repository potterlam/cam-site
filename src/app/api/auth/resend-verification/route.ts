import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/email";

function getSiteUrl(req: NextRequest): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL.replace(/\/$/, "");
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const fwdHost = req.headers.get("x-forwarded-host");
  const rawHost = req.headers.get("host") ?? "";
  const host = fwdHost ?? rawHost;
  const isInternal = !host || /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(host);
  if (!isInternal) return `${proto}://${host}`;
  return "https://live-party-game.onrender.com";
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "No account found with this email." }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "This account is already verified." }, { status: 400 });
    }

    // Delete old tokens for this email
    await db.verificationToken.deleteMany({ where: { identifier: email } });

    // Generate a new token
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.verificationToken.create({
      data: { identifier: email, token, expires },
    });

    const baseUrl = getSiteUrl(req);
    console.log("[ResendVerification] Using baseUrl:", baseUrl);
    await sendVerificationEmail(email, token, baseUrl);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[ResendVerification] Error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
