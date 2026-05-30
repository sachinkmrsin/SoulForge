import { Router } from "express";
import { db, players } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { xpForLevel } from "../lib/xp";

const router = Router();

function formatPlayer(player: typeof players.$inferSelect, username: string) {
  return {
    id: player.id,
    userId: player.userId,
    username,
    level: player.level,
    xp: player.xp,
    xpToNextLevel: xpForLevel(player.level),
    hp: player.hp,
    maxHp: player.maxHp,
    gold: player.gold,
    strength: player.strength,
    endurance: player.endurance,
    dexterity: player.dexterity,
    faith: player.faith,
    avatarClass: player.avatarClass,
    equippedSkills: JSON.parse(player.equippedSkills || "[]"),
    createdAt: player.createdAt.toISOString(),
  };
}

router.get("/", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const [player] = await db.select().from(players).where(eq(players.userId, user.id));
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }
  res.json(formatPlayer(player, user.username));
});

router.patch("/", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const [player] = await db.select().from(players).where(eq(players.userId, user.id));
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }
  res.json(formatPlayer(player, user.username));
});

router.patch("/avatar", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { avatarClass } = req.body;
  if (!avatarClass) {
    res.status(400).json({ error: "avatarClass required" });
    return;
  }
  const [updated] = await db
    .update(players)
    .set({ avatarClass })
    .where(eq(players.userId, user.id))
    .returning();
  res.json(formatPlayer(updated, user.username));
});

export { formatPlayer };
export default router;
