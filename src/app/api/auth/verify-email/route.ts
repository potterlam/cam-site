import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(new URL("/auth/verify-email?error=invalid", req.url));
  }

  try {
    // Find the verification token
    const record = await db.verificationToken.findUnique({
      where: { identifier_token: { identifier: email, token } },
    });

    if (!record) {
      return NextResponse.redirect(new URL("/auth/verify-email?error=invalid", req.url));
    }

    if (record.expires < new Date()) {
      // Expired — clean up and redirect
      await db.verificationToken.delete({
        where: { identifier_token: { identifier: email, token } },
      });
      return NextResponse.redirect(new URL("/auth/verify-email?error=expired", req.url));
    }

    // Mark user as verified
    await db.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    // Delete the used token
    await db.verificationToken.delete({
      where: { identifier_token: { identifier: email, token } },
    });

    return NextResponse.redirect(new URL("/auth/verify-email?success=1", req.url));
  } catch (err) {
    console.error("[VerifyEmail] Error:", err);
    return NextResponse.redirect(new URL("/auth/verify-email?error=server", req.url));
  }
}
