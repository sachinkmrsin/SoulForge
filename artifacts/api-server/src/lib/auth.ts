import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { db, users } from "@workspace/db";
import { eq } from "drizzle-orm";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + process.env.SESSION_SECRET).digest("hex");
}

export function generateToken(userId: string): string {
  const payload = JSON.stringify({ userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const sig = crypto.createHmac("sha256", process.env.SESSION_SECRET || "secret").update(payload).digest("hex");
  return Buffer.from(payload).toString("base64url") + "." + sig;
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return null;
    const payload = Buffer.from(payloadB64, "base64url").toString();
    const expectedSig = crypto.createHmac("sha256", process.env.SESSION_SECRET || "secret").update(payload).digest("hex");
    if (sig !== expectedSig) return null;
    const parsed = JSON.parse(payload);
    if (parsed.exp < Date.now()) return null;
    return { userId: parsed.userId };
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  const [user] = await db.select().from(users).where(eq(users.id, decoded.userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  (req as any).user = user;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = (req as any).user;
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Forbidden: admin access required" });
    return;
  }
  next();
}
