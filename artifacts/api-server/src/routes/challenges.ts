import { Router } from "express";
import { db, challenges, goals } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { awardXP } from "../lib/xp";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

function formatChallenge(c: typeof challenges.$inferSelect) {
  return {
    id: c.id,
    userId: c.userId,
    goalId: c.goalId ?? null,
    title: c.title,
    description: c.description,
    duration: c.duration,
    difficulty: c.difficulty,
    xpReward: c.xpReward,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    completedAt: c.completedAt?.toISOString() ?? null,
  };
}

router.get("/", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const all = await db.select().from(challenges).where(eq(challenges.userId, user.id));
  res.json(all.map(formatChallenge));
});

router.post("/generate", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { goalId, duration = "daily", count = 3 } = req.body;

  let goalContext = "";
  if (goalId) {
    const [goal] = await db.select().from(goals).where(and(eq(goals.id, goalId), eq(goals.userId, user.id)));
    if (goal) goalContext = `The user's goal is: "${goal.title}"${goal.description ? `. Description: ${goal.description}` : ""}.`;
  }

  const prompt = `You are a wise and demanding trainer in a dark fantasy RPG. Generate ${count} specific, actionable ${duration} challenges for a productivity warrior.
${goalContext}
Duration: ${duration} (daily = one day, weekly = one week, monthly = one month).

Return ONLY a JSON array of ${count} objects, no other text. Each object must have:
- "title": short challenge name (max 60 chars)
- "description": specific actionable description (max 200 chars) 
- "difficulty": one of "easy", "medium", "hard", "legendary"
- "xpReward": integer 50-500 based on difficulty

Make the challenges feel like Dark Souls — demanding but achievable. Use dark fantasy language.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.choices[0]?.message?.content ?? "[]";
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const parsed: Array<{ title: string; description: string; difficulty: string; xpReward: number }> =
      jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    const inserted = await Promise.all(
      parsed.slice(0, count).map((c) =>
        db.insert(challenges).values({
          userId: user.id,
          goalId: goalId ?? null,
          title: c.title,
          description: c.description,
          duration,
          difficulty: c.difficulty,
          xpReward: c.xpReward,
        }).returning()
      )
    );

    res.status(201).json(inserted.flat().map(formatChallenge));
  } catch (err) {
    res.status(500).json({ error: "Failed to generate challenges" });
  }
});

router.patch("/:challengeId", requireAuth, async (req, res) => {
  const challengeId = parseInt(req.params.challengeId);
  const { status } = req.body;
  const [updated] = await db
    .update(challenges)
    .set({ ...(status !== undefined && { status }) })
    .where(eq(challenges.id, challengeId))
    .returning();
  res.json(formatChallenge(updated));
});

router.post("/:challengeId/complete", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const challengeId = parseInt(req.params.challengeId);
  const [challenge] = await db.select().from(challenges).where(and(eq(challenges.id, challengeId), eq(challenges.userId, user.id)));
  if (!challenge || challenge.status === "completed") {
    res.status(400).json({ error: "Challenge not found or already completed" });
    return;
  }

  await db.update(challenges).set({ status: "completed", completedAt: new Date() }).where(eq(challenges.id, challengeId));
  const result = await awardXP(user.id, challenge.xpReward, `Completed challenge: ${challenge.title}`, "challenge_complete", true, Math.floor(challenge.xpReward / 4));

  res.json({
    xpGained: challenge.xpReward,
    player: result.player,
    leveledUp: result.leveledUp,
    bossHpReduced: result.bossHpReduced,
    loot: result.loot.map((l) => ({ id: l.id, userId: l.userId, name: l.name, description: l.description, rarity: l.rarity, type: l.type, obtainedAt: l.obtainedAt.toISOString() })),
  });
});

export default router;
