import { Router } from "express";
import { db, habits, subtasks, activityLog } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const year = parseInt(req.query.year as string);
  const month = parseInt(req.query.month as string);

  if (isNaN(year) || isNaN(month)) {
    res.status(400).json({ error: "year and month are required" });
    return;
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const allHabits = await db.select().from(habits).where(eq(habits.userId, user.id));
  const habitsTotal = allHabits.length;

  const completedSubtasks = await db
    .select()
    .from(subtasks)
    .where(
      and(
        eq(subtasks.userId, user.id),
        gte(subtasks.completedAt, startDate),
        lte(subtasks.completedAt, endDate)
      )
    );

  const logs = await db
    .select()
    .from(activityLog)
    .where(
      and(
        eq(activityLog.userId, user.id),
        gte(activityLog.timestamp, startDate),
        lte(activityLog.timestamp, endDate)
      )
    );

  const daysInMonth = endDate.getDate();
  const days = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayStart = new Date(year, month - 1, day);
    const dayEnd = new Date(year, month - 1, day, 23, 59, 59);

    const dayHabitsCompleted = allHabits.filter((h) => {
      if (!h.lastCheckin) return false;
      const c = h.lastCheckin;
      return c >= dayStart && c <= dayEnd;
    }).length;

    const daySubtasks = completedSubtasks.filter((s) => {
      const c = s.completedAt!;
      return c >= dayStart && c <= dayEnd;
    }).length;

    const dayXp = logs
      .filter((l) => l.timestamp >= dayStart && l.timestamp <= dayEnd)
      .reduce((sum, l) => sum + l.xpGained, 0);

    days.push({
      date: dateStr,
      habitsCompleted: dayHabitsCompleted,
      habitsTotal,
      subtasksCompleted: daySubtasks,
      xpEarned: dayXp,
      hasCheckin: dayHabitsCompleted > 0 || daySubtasks > 0,
    });
  }

  res.json(days);
});

router.get("/:date", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const dateStr = req.params.date as string;
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    res.status(400).json({ error: "Invalid date" });
    return;
  }

  const year = parsed.getFullYear();
  const month = parsed.getMonth();
  const day = parsed.getDate();
  const dayStart = new Date(year, month, day);
  const dayEnd = new Date(year, month, day, 23, 59, 59);

  const allHabits = await db.select().from(habits).where(eq(habits.userId, user.id));
  const habitsCompleted = allHabits.filter((h) => h.lastCheckin && h.lastCheckin >= dayStart && h.lastCheckin <= dayEnd).length;

  const daySubtasks = await db
    .select()
    .from(subtasks)
    .where(and(eq(subtasks.userId, user.id), gte(subtasks.completedAt, dayStart), lte(subtasks.completedAt, dayEnd)));

  const logs = await db
    .select()
    .from(activityLog)
    .where(and(eq(activityLog.userId, user.id), gte(activityLog.timestamp, dayStart), lte(activityLog.timestamp, dayEnd)));

  const xpEarned = logs.reduce((sum, l) => sum + l.xpGained, 0);

  res.json({
    date: dateStr,
    habitsCompleted,
    habitsTotal: allHabits.length,
    subtasksCompleted: daySubtasks.length,
    xpEarned,
    hasCheckin: habitsCompleted > 0 || daySubtasks.length > 0,
  });
});

export default router;
