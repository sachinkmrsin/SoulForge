import { Router } from "express";
import { db, players, skillDefinitions } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { xpForLevel } from "../lib/xp";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const [player] = await db.select().from(players).where(eq(players.userId, user.id));
    const equipped: string[] = JSON.parse(player?.equippedSkills || "[]");

    const dbSkills = await db.select().from(skillDefinitions).orderBy(asc(skillDefinitions.levelRequired), asc(skillDefinitions.id));

    const skills = dbSkills.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      effect: s.effect,
      levelRequired: s.levelRequired,
      isUnlocked: (player?.level ?? 1) >= s.levelRequired,
      isEquipped: equipped.includes(s.name),
    }));

    res.json(skills);
  } catch (err) {
    console.error("GET /skills error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:skillId/equip", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const skillId = req.params.skillId as string;
    const [skill] = await db.select().from(skillDefinitions).where(eq(skillDefinitions.id, skillId));
    if (!skill) {
      res.status(404).json({ error: "Skill not found" });
      return;
    }
    const [player] = await db.select().from(players).where(eq(players.userId, user.id));
    if (!player) {
      res.status(404).json({ error: "Player not found" });
      return;
    }
    if (player.level < skill.levelRequired) {
      res.status(400).json({ error: `Requires level ${skill.levelRequired}` });
      return;
    }
    const equipped: string[] = JSON.parse(player.equippedSkills || "[]");
    if (!equipped.includes(skill.name)) {
      if (equipped.length >= 3) {
        res.status(400).json({ error: "Can only equip 3 skills at a time" });
        return;
      }
      equipped.push(skill.name);
    }
    const [updated] = await db.update(players).set({ equippedSkills: JSON.stringify(equipped) }).where(eq(players.userId, user.id)).returning();
    res.json({
      id: updated.id, userId: updated.userId, username: user.username, level: updated.level, xp: updated.xp,
      xpToNextLevel: xpForLevel(updated.level), hp: updated.hp, maxHp: updated.maxHp, gold: updated.gold,
      strength: updated.strength, endurance: updated.endurance, dexterity: updated.dexterity, faith: updated.faith,
      avatarClass: updated.avatarClass, equippedSkills: JSON.parse(updated.equippedSkills || "[]"), createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("POST /skills/:skillId/equip error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:skillId/equip", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const skillId = req.params.skillId as string;
    const [skill] = await db.select().from(skillDefinitions).where(eq(skillDefinitions.id, skillId));
    if (!skill) {
      res.status(404).json({ error: "Skill not found" });
      return;
    }
    const [player] = await db.select().from(players).where(eq(players.userId, user.id));
    if (!player) {
      res.status(404).json({ error: "Player not found" });
      return;
    }
    const equipped: string[] = JSON.parse(player.equippedSkills || "[]").filter((s: string) => s !== skill.name);
    const [updated] = await db.update(players).set({ equippedSkills: JSON.stringify(equipped) }).where(eq(players.userId, user.id)).returning();
    res.json({
      id: updated.id, userId: updated.userId, username: user.username, level: updated.level, xp: updated.xp,
      xpToNextLevel: xpForLevel(updated.level), hp: updated.hp, maxHp: updated.maxHp, gold: updated.gold,
      strength: updated.strength, endurance: updated.endurance, dexterity: updated.dexterity, faith: updated.faith,
      avatarClass: updated.avatarClass, equippedSkills: JSON.parse(updated.equippedSkills || "[]"), createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("DELETE /skills/:skillId/equip error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
