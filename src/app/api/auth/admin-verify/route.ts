import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Temporary admin endpoint to manually verify a stuck account.
// Usage: GET /api/auth/admin-verify?email=you@example.com&key=CAM2024ADMIN
// Remove this file once auth is confirmed working.

const ADMIN_KEY = process.env.ADMIN_VERIFY_KEY ?? "CAM2024ADMIN";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const key = searchParams.get("key");

  if (key !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!email) {
    return NextResponse.json({ error: "Email param required." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ ok: true, message: "Already verified.", email });
  }

  await db.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  // Clean up any pending tokens
  await db.verificationToken.deleteMany({ where: { identifier: email } });

  return NextResponse.json({ ok: true, message: "Account verified! You can now log in.", email });
}
