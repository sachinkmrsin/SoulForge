import { Router } from "express";
import { db, subtasks, goals } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { awardXP } from "../lib/xp";

const router = Router({ mergeParams: true });

function formatSubtask(s: typeof subtasks.$inferSelect) {
  return {
    id: s.id,
    goalId: s.goalId,
    userId: s.userId,
    title: s.title,
    completed: s.completed,
    xpReward: s.xpReward,
    createdAt: s.createdAt.toISOString(),
    completedAt: s.completedAt?.toISOString() ?? null,
  };
}

router.get("/", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const goalId = req.params.goalId as string;
  const subs = await db.select().from(subtasks).where(and(eq(subtasks.goalId, goalId), eq(subtasks.userId, user.id)));
  res.json(subs.map(formatSubtask));
});

router.post("/", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const goalId = req.params.goalId as string;
  const { title, xpReward = 25 } = req.body;
  if (!title) {
    res.status(400).json({ error: "Title required" });
    return;
  }
  const [sub] = await db.insert(subtasks).values({ goalId, userId: user.id, title, xpReward }).returning();
  res.status(201).json(formatSubtask(sub));
});

router.patch("/:subtaskId", requireAuth, async (req, res) => {
  const subtaskId = req.params.subtaskId as string;
  const { title, completed } = req.body;
  const [updated] = await db
    .update(subtasks)
    .set({
      ...(title !== undefined && { title }),
      ...(completed !== undefined && { completed }),
    })
    .where(eq(subtasks.id, subtaskId))
    .returning();
  res.json(formatSubtask(updated));
});

router.delete("/:subtaskId", requireAuth, async (req, res) => {
  const subtaskId = req.params.subtaskId as string;
  await db.delete(subtasks).where(eq(subtasks.id, subtaskId));
  res.json({ message: "Subtask deleted" });
});

router.post("/:subtaskId/complete", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const subtaskId = req.params.subtaskId as string;
  const [sub] = await db.select().from(subtasks).where(eq(subtasks.id, subtaskId));
  if (!sub || sub.completed) {
    res.status(400).json({ error: "Subtask not found or already completed" });
    return;
  }

  await db.update(subtasks).set({ completed: true, completedAt: new Date() }).where(eq(subtasks.id, subtaskId));

  const result = await awardXP(user.id, sub.xpReward, `Completed subtask: ${sub.title}`, "subtask_complete", false, Math.floor(sub.xpReward / 3));
  res.json({
    xpGained: sub.xpReward,
    player: result.player,
    leveledUp: result.leveledUp,
    bossHpReduced: result.bossHpReduced,
    loot: result.loot,
  });
});

export default router;
