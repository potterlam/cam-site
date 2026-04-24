import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${BASE_URL}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Verify your Cam Party Game account",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
        <h2 style="color:#7c3aed">🎮 Cam Party Game</h2>
        <p>Thanks for signing up! Please verify your email address to activate your account.</p>
        <p>This confirms you are a real person and takes responsibility for your account activity.</p>
        <a href="${verifyUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
          Verify Email Address
        </a>
        <p style="color:#999;font-size:12px;margin-top:24px">
          This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("[Email] Failed to send verification to", email, error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }

  console.log("[Email] Verification email sent to", email);
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${BASE_URL}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Reset your Cam Party Game password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
        <h2 style="color:#7c3aed">🎮 Cam Party Game</h2>
        <p>We received a request to reset your password.</p>
        <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
          Reset Password
        </a>
        <p style="color:#999;font-size:12px;margin-top:24px">
          If you didn't request this, you can safely ignore this email. Your password will not change.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("[Email] Failed to send password reset to", email, error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }

  console.log("[Email] Password reset email sent to", email);
}
