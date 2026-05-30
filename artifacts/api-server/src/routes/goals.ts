import { Router } from "express";
import { db, goals, subtasks } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { awardXP } from "../lib/xp";

const router = Router();

function formatGoal(goal: typeof goals.$inferSelect, subtaskCount = 0, completedSubtaskCount = 0) {
  return {
    id: goal.id,
    userId: goal.userId,
    title: goal.title,
    description: goal.description ?? null,
    status: goal.status,
    priority: goal.priority,
    xpReward: goal.xpReward,
    deadline: goal.deadline?.toISOString() ?? null,
    createdAt: goal.createdAt.toISOString(),
    completedAt: goal.completedAt?.toISOString() ?? null,
    subtaskCount,
    completedSubtaskCount,
  };
}

router.get("/", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const allGoals = await db.select().from(goals).where(eq(goals.userId, user.id));

  const result = await Promise.all(
    allGoals.map(async (goal) => {
      const allSubs = await db.select().from(subtasks).where(eq(subtasks.goalId, goal.id));
      const completed = allSubs.filter((s) => s.completed).length;
      return formatGoal(goal, allSubs.length, completed);
    })
  );

  res.json(result);
});

router.post("/", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { title, description, priority = "medium", deadline, xpReward } = req.body;
  if (!title) {
    res.status(400).json({ error: "Title required" });
    return;
  }

  const xp = xpReward ?? (priority === "legendary" ? 500 : priority === "high" ? 250 : priority === "medium" ? 150 : 100);
  const [goal] = await db
    .insert(goals)
    .values({
      userId: user.id,
      title,
      description,
      priority,
      xpReward: xp,
      deadline: deadline ? new Date(deadline) : undefined,
    })
    .returning();

  res.status(201).json(formatGoal(goal));
});

router.get("/:goalId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const goalId = parseInt(req.params.goalId);
  const [goal] = await db.select().from(goals).where(and(eq(goals.id, goalId), eq(goals.userId, user.id)));
  if (!goal) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }
  const subs = await db.select().from(subtasks).where(eq(subtasks.goalId, goalId));
  const formattedSubs = subs.map((s) => ({
    id: s.id,
    goalId: s.goalId,
    userId: s.userId,
    title: s.title,
    completed: s.completed,
    xpReward: s.xpReward,
    createdAt: s.createdAt.toISOString(),
    completedAt: s.completedAt?.toISOString() ?? null,
  }));
  res.json({
    ...formatGoal(goal, subs.length, subs.filter((s) => s.completed).length),
    subtasks: formattedSubs,
  });
});

router.patch("/:goalId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const goalId = parseInt(req.params.goalId);
  const { title, description, priority, deadline, status } = req.body;

  const [existing] = await db.select().from(goals).where(and(eq(goals.id, goalId), eq(goals.userId, user.id)));
  if (!existing) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }

  const [updated] = await db
    .update(goals)
    .set({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(priority !== undefined && { priority }),
      ...(deadline !== undefined && { deadline: new Date(deadline) }),
      ...(status !== undefined && { status }),
    })
    .where(eq(goals.id, goalId))
    .returning();

  const subs = await db.select().from(subtasks).where(eq(subtasks.goalId, goalId));
  res.json(formatGoal(updated, subs.length, subs.filter((s) => s.completed).length));
});

router.delete("/:goalId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const goalId = parseInt(req.params.goalId);
  await db.delete(goals).where(and(eq(goals.id, goalId), eq(goals.userId, user.id)));
  res.json({ message: "Goal deleted" });
});

router.post("/:goalId/complete", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const goalId = parseInt(req.params.goalId);
  const [goal] = await db.select().from(goals).where(and(eq(goals.id, goalId), eq(goals.userId, user.id)));
  if (!goal) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }
  if (goal.status === "completed") {
    res.status(400).json({ error: "Goal already completed" });
    return;
  }

  await db.update(goals).set({ status: "completed", completedAt: new Date() }).where(eq(goals.id, goalId));

  const result = await awardXP(user.id, goal.xpReward, `Completed goal: ${goal.title}`, "goal_complete", true, Math.floor(goal.xpReward / 5));
  res.json({
    xpGained: goal.xpReward,
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
