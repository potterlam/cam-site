import { NextResponse } from "next/server";

// Quick env check — visit /api/health to confirm all vars are loaded on Render
export async function GET() {
  const checks = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL ?? "NOT SET",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "NOT SET",
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST ?? "not set (ok if trustHost in code)",
    NODE_ENV: process.env.NODE_ENV,
  };

  const allCriticalSet =
    checks.DATABASE_URL && checks.AUTH_SECRET && checks.RESEND_API_KEY;

  return NextResponse.json(
    { ok: allCriticalSet, checks },
    { status: allCriticalSet ? 200 : 500 }
  );
}
