import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@hr-automation/db";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

/**
 * Retrieves the current session user.
 * In development mode, provides a fallback demo user if not logged in.
 * Guarantees the user record exists in the database to prevent foreign key errors.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);

  let user: SessionUser | null = null;

  if (session?.user?.id) {
    user = {
      id: session.user.id,
      email: session.user.email || "user@company.com",
      name: session.user.name || "User",
    };
  } else if (process.env.NODE_ENV !== "production") {
    // Development convenience fallback
    user = {
      id: "demo-user-id",
      email: "demo@company.com",
      name: "Tushar (Dev)",
    };
  }

  if (user) {
    // Ensure user exists in database for relational FK integrity
    try {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {
          email: user.email,
          name: user.name,
        },
        create: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (err) {
      console.error("[Auth] User upsert error:", err);
    }
  }

  return user;
}
