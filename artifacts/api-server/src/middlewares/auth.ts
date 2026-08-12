import type { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { and, eq } from "drizzle-orm";
import { appUsersTable, type AppUser } from "@workspace/db";
import { db } from "@workspace/db";

type AuthenticatedRequest = Request & { appUser?: AppUser };

export async function ensureAppUser(req: Request): Promise<AppUser | null> {
  const userId = getAuth(req).userId;
  if (!userId) return null;

  const existing = await db
    .select()
    .from(appUsersTable)
    .where(eq(appUsersTable.clerkUserId, userId))
    .limit(1);
  if (existing[0]) return existing[0];

  const inserted = await db
    .insert(appUsersTable)
    .values({ clerkUserId: userId })
    .returning();
  return inserted[0] ?? null;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await ensureAppUser(req);
    if (!user) {
      res.status(401).json({ error: "Sign in to continue." });
      return;
    }
    (req as AuthenticatedRequest).appUser = user;
    next();
  } catch (error) {
    req.log.error({ err: error }, "Could not establish the signed-in user");
    res.status(500).json({ error: "Could not establish your account." });
  }
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  await requireAuth(req, res, () => {
    const user = (req as AuthenticatedRequest).appUser;
    if (user?.role !== "admin") {
      res.status(403).json({ error: "Admin access is required." });
      return;
    }
    next();
  });
}

export function appUser(req: Request): AppUser {
  return (req as AuthenticatedRequest).appUser!;
}

export async function claimFirstAdmin(req: Request): Promise<AppUser | null> {
  const user = await ensureAppUser(req);
  if (!user) return null;
  const admins = await db
    .select({ id: appUsersTable.id })
    .from(appUsersTable)
    .where(eq(appUsersTable.role, "admin"))
    .limit(1);
  if (admins.length) return user;
  const updated = await db
    .update(appUsersTable)
    .set({ role: "admin" })
    .where(and(eq(appUsersTable.id, user.id), eq(appUsersTable.role, "customer")))
    .returning();
  return updated[0] ?? user;
}