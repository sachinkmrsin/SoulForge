import { Router } from "express";
import { db, players, skillDefinitions } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { xpForLevel } from "../lib/xp";

const router = Router();

const SKILLS_CATALOG = [
  { name: "Soul Link", description: "Your completed tasks deal 10% more damage to bosses.", effect: "boss_damage_+10%", levelRequired: 1 },
  { name: "Iron Will", description: "Habit streaks now give double XP bonus.", effect: "streak_xp_x2", levelRequired: 3 },
  { name: "Ember Ward", description: "Once per day, gain 20% more XP from any action.", effect: "xp_boost_daily", levelRequired: 5 },
  { name: "Cursed Focus", description: "Legendary goals award 50% more XP.", effect: "legendary_xp_+50%", levelRequired: 8 },
  { name: "Undead Resolve", description: "Never lose your habit streak on missed days.", effect: "streak_preserve", levelRequired: 10 },
  { name: "Dark Covenant", description: "All boss loot has improved rarity.", effect: "loot_rarity_up", levelRequired: 12 },
  { name: "Estus Surge", description: "Complete 5 habits in a day to gain a full HP restore.", effect: "hp_restore_5habits", levelRequired: 15 },
  { name: "Soul Ascension", description: "Gain a free daily challenge every week.", effect: "free_challenge_weekly", levelRequired: 20 },
];

router.get("/", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const [player] = await db.select().from(players).where(eq(players.userId, user.id));
  const equipped: string[] = JSON.parse(player?.equippedSkills || "[]");

  const skills = SKILLS_CATALOG.map((s, i) => ({
    id: i + 1,
    name: s.name,
    description: s.description,
    effect: s.effect,
    levelRequired: s.levelRequired,
    isUnlocked: (player?.level ?? 1) >= s.levelRequired,
    isEquipped: equipped.includes(s.name),
  }));

  res.json(skills);
});

router.post("/:skillId/equip", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const skillId = parseInt(req.params.skillId) - 1;
  const skill = SKILLS_CATALOG[skillId];
  if (!skill) {
    res.status(404).json({ error: "Skill not found" });
    return;
  }
  const [player] = await db.select().from(players).where(eq(players.userId, user.id));
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
});

router.delete("/:skillId/equip", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const skillId = parseInt(req.params.skillId) - 1;
  const skill = SKILLS_CATALOG[skillId];
  if (!skill) {
    res.status(404).json({ error: "Skill not found" });
    return;
  }
  const [player] = await db.select().from(players).where(eq(players.userId, user.id));
  const equipped: string[] = JSON.parse(player.equippedSkills || "[]").filter((s: string) => s !== skill.name);
  const [updated] = await db.update(players).set({ equippedSkills: JSON.stringify(equipped) }).where(eq(players.userId, user.id)).returning();
  res.json({
    id: updated.id, userId: updated.userId, username: user.username, level: updated.level, xp: updated.xp,
    xpToNextLevel: xpForLevel(updated.level), hp: updated.hp, maxHp: updated.maxHp, gold: updated.gold,
    strength: updated.strength, endurance: updated.endurance, dexterity: updated.dexterity, faith: updated.faith,
    avatarClass: updated.avatarClass, equippedSkills: JSON.parse(updated.equippedSkills || "[]"), createdAt: updated.createdAt.toISOString(),
  });
});

export default router;
