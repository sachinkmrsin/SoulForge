import { Router } from "express";
import { db, habits } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { awardXP } from "../lib/xp";

const router = Router();

const TIME_ORDER = ["morning", "afternoon", "evening", "anytime"];

function formatHabit(h: typeof habits.$inferSelect, completedToday: boolean) {
  return {
    id: h.id,
    userId: h.userId,
    title: h.title,
    description: h.description ?? null,
    frequency: h.frequency,
    timeOfDay: h.timeOfDay,
    xpReward: h.xpReward,
    streak: h.streak,
    lastCheckin: h.lastCheckin?.toISOString() ?? null,
    createdAt: h.createdAt.toISOString(),
    completedToday,
  };
}

function isToday(date: Date | null): boolean {
  if (!date) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

router.get("/", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const allHabits = await db.select().from(habits).where(eq(habits.userId, user.id));
  const sorted = allHabits.sort(
    (a, b) => TIME_ORDER.indexOf(a.timeOfDay) - TIME_ORDER.indexOf(b.timeOfDay)
  );
  res.json(sorted.map((h) => formatHabit(h, isToday(h.lastCheckin))));
});

router.post("/", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { title, description, frequency = "daily", timeOfDay = "anytime", xpReward = 30 } = req.body;
  if (!title) {
    res.status(400).json({ error: "Title required" });
    return;
  }
  const [habit] = await db.insert(habits).values({ userId: user.id, title, description, frequency, timeOfDay, xpReward }).returning();
  res.status(201).json(formatHabit(habit, false));
});

router.patch("/:habitId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const habitId = parseInt(req.params.habitId);
  const { title, description, frequency, timeOfDay, xpReward } = req.body;
  const [updated] = await db
    .update(habits)
    .set({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(frequency !== undefined && { frequency }),
      ...(timeOfDay !== undefined && { timeOfDay }),
      ...(xpReward !== undefined && { xpReward }),
    })
    .where(and(eq(habits.id, habitId), eq(habits.userId, user.id)))
    .returning();
  res.json(formatHabit(updated, isToday(updated.lastCheckin)));
});

router.delete("/:habitId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const habitId = parseInt(req.params.habitId);
  await db.delete(habits).where(and(eq(habits.id, habitId), eq(habits.userId, user.id)));
  res.json({ message: "Habit deleted" });
});

router.post("/:habitId/checkin", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const habitId = parseInt(req.params.habitId);
  const [habit] = await db.select().from(habits).where(and(eq(habits.id, habitId), eq(habits.userId, user.id)));
  if (!habit) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }
  if (isToday(habit.lastCheckin)) {
    res.status(400).json({ error: "Already checked in today" });
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const wasYesterday = habit.lastCheckin &&
    habit.lastCheckin.getFullYear() === yesterday.getFullYear() &&
    habit.lastCheckin.getMonth() === yesterday.getMonth() &&
    habit.lastCheckin.getDate() === yesterday.getDate();

  const newStreak = wasYesterday ? habit.streak + 1 : 1;
  await db.update(habits).set({ streak: newStreak, lastCheckin: new Date() }).where(eq(habits.id, habitId));

  const streakBonus = Math.floor(newStreak / 7) * 10;
  const totalXp = habit.xpReward + streakBonus;

  const result = await awardXP(
    user.id,
    totalXp,
    `Checked in habit: ${habit.title}${streakBonus > 0 ? ` (streak bonus +${streakBonus})` : ""}`,
    "habit_checkin",
    newStreak % 7 === 0,
    Math.floor(habit.xpReward / 4)
  );

  res.json({
    xpGained: totalXp,
    player: result.player,
    leveledUp: result.leveledUp,
    bossHpReduced: result.bossHpReduced,
    loot: result.loot.map((l) => ({
      id: l.id,
      userId: l.userId,
      name: l.name,
      description: l.description,
      rarity: l.rarity,
      type: l.type,
      obtainedAt: l.obtainedAt.toISOString(),
    })),
  });
});

export default router;
