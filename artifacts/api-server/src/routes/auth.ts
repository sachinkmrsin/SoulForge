import { Router } from "express";
import { db, users, players } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { hashPassword, generateToken, requireAuth } from "../lib/auth";

const router = Router();

router.post("/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { username, password } = parsed.data;

  const existing = await db.select().from(users).where(eq(users.username, username));
  if (existing.length > 0) {
    res.status(400).json({ error: "Username already taken" });
    return;
  }

  const passwordHash = hashPassword(password);
  const [user] = await db.insert(users).values({ username, passwordHash }).returning();

  // Create player profile
  await db.insert(players).values({ userId: user.id });

  const token = generateToken(user.id);
  res.status(201).json({
    user: { id: user.id, username: user.username, createdAt: user.createdAt.toISOString(), isPro: user.isPro },
    token,
  });
});

router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { username, password } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.username, username));
  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = generateToken(user.id);
  res.json({
    user: { id: user.id, username: user.username, createdAt: user.createdAt.toISOString(), isPro: user.isPro },
    token,
  });
});

router.post("/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = (req as any).user;
  res.json({ id: user.id, username: user.username, createdAt: user.createdAt.toISOString(), isPro: user.isPro });
});

export default router;
