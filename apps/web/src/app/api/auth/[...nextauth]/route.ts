import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * On Vercel, Google OAuth redirect_uri is built from NEXTAUTH_URL.
 * If that env is missing or still "localhost", users land on
 * localhost:3000/api/auth/callback/google after picking an account.
 * Derive the public HTTPS URL from Vercel when needed.
 */
function ensureAuthUrl() {
  const current = process.env.NEXTAUTH_URL ?? "";
  const onVercel = process.env.VERCEL === "1";
  const looksLocal =
    !current ||
    current.includes("localhost") ||
    current.includes("127.0.0.1");

  if (onVercel && looksLocal) {
    const host = (
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      process.env.VERCEL_URL ||
      ""
    ).replace(/^https?:\/\//, "");
    if (host) {
      process.env.NEXTAUTH_URL = `https://${host}`;
    }
  }
}

ensureAuthUrl();

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
