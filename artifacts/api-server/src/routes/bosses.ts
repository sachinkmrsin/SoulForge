import { Router } from "express";
import { db, bosses, bossBattles, players, inventoryItems, activityLog } from "@workspace/db";
import { eq, and, isNull, isNotNull } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { awardXP, rollLoot, xpForLevel } from "../lib/xp";

const router = Router();

function formatBoss(b: typeof bosses.$inferSelect) {
  return {
    id: b.id,
    name: b.name,
    description: b.description,
    difficulty: b.difficulty,
    maxHp: b.maxHp,
    xpReward: b.xpReward,
    goldReward: b.goldReward,
    lootTable: JSON.parse(b.lootTable || "[]"),
    imageUrl: b.imageUrl ?? null,
    isCustom: b.isCustom,
    createdAt: b.createdAt.toISOString(),
  };
}

function formatBattle(battle: typeof bossBattles.$inferSelect, boss: typeof bosses.$inferSelect) {
  return {
    id: battle.id,
    userId: battle.userId,
    boss: formatBoss(boss),
    currentHp: battle.currentHp,
    startedAt: battle.startedAt.toISOString(),
    attackPoints: battle.attackPoints,
  };
}

router.get("/", requireAuth, async (req, res) => {
  const allBosses = await db.select().from(bosses).where(eq(bosses.isCustom, false));
  res.json(allBosses.map(formatBoss));
});

router.post("/", requireAuth, async (req, res) => {
  const user = (req as any).user;
  if (!user.isPro) {
    res.status(403).json({ error: "Pro subscription required to create custom bosses" });
    return;
  }
  const { name, description, difficulty = "medium", maxHp = 1000, xpReward, goldReward } = req.body;
  const xp = xpReward ?? (difficulty === "legendary" ? 2000 : difficulty === "hard" ? 1000 : difficulty === "medium" ? 500 : 200);
  const gold = goldReward ?? Math.floor(xp / 5);
  const [boss] = await db
    .insert(bosses)
    .values({ name, description: description || "", difficulty, maxHp, xpReward: xp, goldReward: gold, createdByUserId: user.id, isCustom: true })
    .returning();
  res.status(201).json(formatBoss(boss));
});

router.get("/active", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const [battle] = await db.select().from(bossBattles).where(and(eq(bossBattles.userId, user.id), isNull(bossBattles.defeatedAt)));
  if (!battle) {
    res.status(404).json({ error: "No active boss battle" });
    return;
  }
  const [boss] = await db.select().from(bosses).where(eq(bosses.id, battle.bossId));
  res.json(formatBattle(battle, boss));
});

router.post("/active/attack", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const [battle] = await db.select().from(bossBattles).where(and(eq(bossBattles.userId, user.id), isNull(bossBattles.defeatedAt)));
  if (!battle) {
    res.status(404).json({ error: "No active boss battle" });
    return;
  }
  if (battle.attackPoints < 1) {
    res.status(400).json({ error: "No attack points. Complete habits or tasks to earn attack points." });
    return;
  }

  const [boss] = await db.select().from(bosses).where(eq(bosses.id, battle.bossId));
  const [player] = await db.select().from(players).where(eq(players.userId, user.id));

  const damage = Math.floor((player.strength * battle.attackPoints * 10) + Math.random() * 50);
  const newHp = Math.max(0, battle.currentHp - damage);
  const newAttackPoints = 0;
  const bossDefeated = newHp === 0;

  let updatedBattle: typeof bossBattles.$inferSelect;
  let earnedLoot: typeof inventoryItems.$inferSelect[] = [];
  let xpGained = 0;
  let updatedPlayer = player;

  if (bossDefeated) {
    [updatedBattle] = await db
      .update(bossBattles)
      .set({ currentHp: 0, attackPoints: 0, defeatedAt: new Date(), xpEarned: boss.xpReward, goldEarned: boss.goldReward })
      .where(eq(bossBattles.id, battle.id))
      .returning();

    const lootItems = rollLoot(3);
    for (const item of lootItems) {
      const [inserted] = await db.insert(inventoryItems).values({ userId: user.id, name: item.name, description: item.description, rarity: item.rarity, type: item.type }).returning();
      earnedLoot.push(inserted);
    }

    const result = await awardXP(user.id, boss.xpReward, `Defeated boss: ${boss.name}`, "boss_defeated", false, 0);
    xpGained = boss.xpReward;
    updatedPlayer = result.player;

    await db.update(players).set({ gold: updatedPlayer.gold + boss.goldReward }).where(eq(players.userId, user.id));
  } else {
    [updatedBattle] = await db
      .update(bossBattles)
      .set({ currentHp: newHp, attackPoints: newAttackPoints })
      .where(eq(bossBattles.id, battle.id))
      .returning();

    await db.insert(activityLog).values({ userId: user.id, type: "boss_attack", description: `Dealt ${damage} damage to ${boss.name}`, xpGained: 0 });
  }

  res.json({
    damage,
    bossBattle: formatBattle(updatedBattle, boss),
    bossDefeated,
    loot: earnedLoot.map((l) => ({ id: l.id, userId: l.userId, name: l.name, description: l.description, rarity: l.rarity, type: l.type, obtainedAt: l.obtainedAt.toISOString() })),
    xpGained,
    player: updatedPlayer,
  });
});

router.get("/history", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const history = await db.select().from(bossBattles).where(and(eq(bossBattles.userId, user.id), isNotNull(bossBattles.defeatedAt)));
  const result = await Promise.all(
    history.map(async (battle) => {
      const [boss] = await db.select().from(bosses).where(eq(bosses.id, battle.bossId));
      return {
        id: battle.id,
        boss: formatBoss(boss),
        defeatedAt: battle.defeatedAt!.toISOString(),
        xpEarned: battle.xpEarned,
        goldEarned: battle.goldEarned,
      };
    })
  );
  res.json(result);
});

router.post("/:bossId/challenge", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const bossId = parseInt(req.params.bossId);

  // Check no active battle
  const [existing] = await db.select().from(bossBattles).where(and(eq(bossBattles.userId, user.id), isNull(bossBattles.defeatedAt)));
  if (existing) {
    res.status(400).json({ error: "You already have an active boss battle" });
    return;
  }

  const [boss] = await db.select().from(bosses).where(eq(bosses.id, bossId));
  if (!boss) {
    res.status(404).json({ error: "Boss not found" });
    return;
  }

  const [battle] = await db.insert(bossBattles).values({ userId: user.id, bossId, currentHp: boss.maxHp }).returning();
  res.json(formatBattle(battle, boss));
});

export default router;
