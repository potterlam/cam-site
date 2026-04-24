import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/email";

const INTERNAL_HOST = /localhost|127\.0\.0\.1|0\.0\.0\.0/;

function getSiteUrl(req: NextRequest): string {
  for (const v of [process.env.SITE_URL, process.env.RENDER_EXTERNAL_URL, process.env.NEXTAUTH_URL]) {
    if (v && !INTERNAL_HOST.test(v)) return v.replace(/\/$/, "");
  }
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  if (host && !INTERNAL_HOST.test(host)) return `${proto}://${host}`;
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
