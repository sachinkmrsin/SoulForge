import { Router } from "express";
import { db, players, goals, habits, bossBattles, bosses, activityLog } from "@workspace/db";
import { eq, and, isNull, gte, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { xpForLevel } from "../lib/xp";

const router = Router();

router.get("/summary", requireAuth, async (req, res) => {
  const user = (req as any).user;

  const [player] = await db.select().from(players).where(eq(players.userId, user.id));
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  const allGoals = await db.select().from(goals).where(eq(goals.userId, user.id));
  const goalsActive = allGoals.filter((g) => g.status === "active").length;
  const goalsCompleted = allGoals.filter((g) => g.status === "completed").length;

  const allHabits = await db.select().from(habits).where(eq(habits.userId, user.id));
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  const habitsCompletedToday = allHabits.filter((h) => h.lastCheckin && h.lastCheckin >= todayStart && h.lastCheckin <= todayEnd).length;

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 7);

  const todayLogs = await db.select().from(activityLog).where(and(eq(activityLog.userId, user.id), gte(activityLog.timestamp, todayStart)));
  const weekLogs = await db.select().from(activityLog).where(and(eq(activityLog.userId, user.id), gte(activityLog.timestamp, weekStart)));

  const todayXp = todayLogs.reduce((sum, l) => sum + l.xpGained, 0);
  const weeklyXp = weekLogs.reduce((sum, l) => sum + l.xpGained, 0);

  const recentActivity = (await db.select().from(activityLog).where(eq(activityLog.userId, user.id)).orderBy(desc(activityLog.timestamp)).limit(10))
    .map((a) => ({ id: a.id, type: a.type, description: a.description, xpGained: a.xpGained, timestamp: a.timestamp.toISOString() }));

  // Calculate streak
  let streak = 0;
  const allLogs = await db.select().from(activityLog).where(eq(activityLog.userId, user.id)).orderBy(desc(activityLog.timestamp));
  const checkedDates = new Set<string>();
  for (const log of allLogs) {
    const d = log.timestamp.toISOString().split("T")[0];
    checkedDates.add(d);
  }
  const sortedDates = Array.from(checkedDates).sort().reverse();
  const todayStr = today.toISOString().split("T")[0];
  if (sortedDates[0] === todayStr) {
    streak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const d = new Date(sortedDates[i - 1]);
      d.setDate(d.getDate() - 1);
      if (sortedDates[i] === d.toISOString().split("T")[0]) streak++;
      else break;
    }
  }

  // Active boss
  let activeBoss = null;
  const [battle] = await db.select().from(bossBattles).where(and(eq(bossBattles.userId, user.id), isNull(bossBattles.defeatedAt)));
  if (battle) {
    const [boss] = await db.select().from(bosses).where(eq(bosses.id, battle.bossId));
    activeBoss = {
      id: battle.id,
      userId: battle.userId,
      boss: { id: boss.id, name: boss.name, description: boss.description, difficulty: boss.difficulty, maxHp: boss.maxHp, xpReward: boss.xpReward, goldReward: boss.goldReward, lootTable: JSON.parse(boss.lootTable || "[]"), imageUrl: boss.imageUrl ?? null, isCustom: boss.isCustom, createdAt: boss.createdAt.toISOString() },
      currentHp: battle.currentHp,
      startedAt: battle.startedAt.toISOString(),
      attackPoints: battle.attackPoints,
    };
  }

  res.json({
    player: {
      id: player.id, userId: player.userId, username: user.username, level: player.level, xp: player.xp,
      xpToNextLevel: xpForLevel(player.level), hp: player.hp, maxHp: player.maxHp, gold: player.gold,
      strength: player.strength, endurance: player.endurance, dexterity: player.dexterity, faith: player.faith,
      avatarClass: player.avatarClass, equippedSkills: JSON.parse(player.equippedSkills || "[]"), createdAt: player.createdAt.toISOString(),
    },
    activeBoss,
    streak,
    todayXp,
    weeklyXp,
    goalsActive,
    goalsCompleted,
    habitsCompletedToday,
    habitsTotal: allHabits.length,
    recentActivity,
  });
});

export default router;
