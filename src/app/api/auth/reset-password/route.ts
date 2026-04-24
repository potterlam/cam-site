import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, token, password } = await req.json();

    if (!email || !token || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const identifier = `reset:${email}`;

    const record = await db.verificationToken.findUnique({
      where: { identifier_token: { identifier, token } },
    });

    if (!record) {
      return NextResponse.json({ error: "Invalid or already used reset link." }, { status: 400 });
    }

    if (record.expires < new Date()) {
      await db.verificationToken.delete({
        where: { identifier_token: { identifier, token } },
      });
      return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // Delete the used token
    await db.verificationToken.delete({
      where: { identifier_token: { identifier, token } },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[ResetPassword] Error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
