import { Router } from "express";
import { db, users, players, bosses, skillDefinitions, inventoryItems, goals, habits, activityLog, bossBattles, challenges } from "@workspace/db";
import { eq, desc, sql, like, or, count } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/dashboard", async (_req, res) => {
  const [{ value: totalUsers }] = await db.select({ value: count() }).from(users);
  const [{ value: totalPlayers }] = await db.select({ value: count() }).from(players);
  const [{ value: totalGoals }] = await db.select({ value: count() }).from(goals);
  const [{ value: totalHabits }] = await db.select({ value: count() }).from(habits);
  const [{ value: totalBosses }] = await db.select({ value: count() }).from(bosses);
  const [{ value: totalItems }] = await db.select({ value: count() }).from(inventoryItems);
  const [{ value: totalSkills }] = await db.select({ value: count() }).from(skillDefinitions);
  const [{ value: totalChallenges }] = await db.select({ value: count() }).from(challenges);

  const recentUsers = await db
    .select({ id: users.id, username: users.username, role: users.role, isPro: users.isPro, createdAt: users.createdAt })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(10);

  const recentActivity = await db
    .select({
      id: activityLog.id,
      type: activityLog.type,
      description: activityLog.description,
      xpGained: activityLog.xpGained,
      timestamp: activityLog.timestamp,
      username: users.username,
    })
    .from(activityLog)
    .innerJoin(users, eq(activityLog.userId, users.id))
    .orderBy(desc(activityLog.timestamp))
    .limit(20);

  const [{ value: activeBattles }] = await db
    .select({ value: count() })
    .from(bossBattles)
    .where(sql`${bossBattles.defeatedAt} IS NULL`);

  res.json({
    stats: {
      totalUsers,
      totalPlayers,
      totalGoals,
      totalHabits,
      totalBosses,
      totalItems,
      totalSkills,
      totalChallenges,
      activeBattles,
    },
    recentUsers: recentUsers.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })),
    recentActivity: recentActivity.map((a) => ({ ...a, timestamp: a.timestamp.toISOString() })),
  });
});

router.get("/users", async (req, res) => {
  const search = (req.query.search as string) || "";
  const role = req.query.role as string | undefined;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  let query = db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      isPro: users.isPro,
      createdAt: users.createdAt,
      level: players.level,
      xp: players.xp,
      gold: players.gold,
      avatarClass: players.avatarClass,
    })
    .from(users)
    .leftJoin(players, eq(users.id, players.userId))
    .$dynamic();

  const conditions = [];
  if (search) {
    conditions.push(like(users.username, `%${search}%`));
  }
  if (role) {
    conditions.push(eq(users.role, role));
  }
  if (conditions.length > 0) {
    query = query.where(conditions.length === 1 ? conditions[0] : sql.join(conditions, sql` AND `));
  }

  const allUsers = await query.orderBy(desc(users.createdAt)).limit(limit).offset(offset);

  let countQuery = db.select({ value: count() }).from(users).$dynamic();
  if (conditions.length > 0) {
    countQuery = countQuery.where(conditions.length === 1 ? conditions[0] : sql.join(conditions, sql` AND `));
  }
  const [{ value: total }] = await countQuery;

  res.json({
    users: allUsers.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      level: u.level ?? 1,
      xp: u.xp ?? 0,
      gold: u.gold ?? 0,
      avatarClass: u.avatarClass ?? "knight",
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

router.get("/users/:userId", async (req, res) => {
  const userId = req.params.userId as string;
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const [player] = await db.select().from(players).where(eq(players.userId, userId));
  const userGoals = await db.select().from(goals).where(eq(goals.userId, userId));
  const userHabits = await db.select().from(habits).where(eq(habits.userId, userId));
  const userItems = await db.select().from(inventoryItems).where(eq(inventoryItems.userId, userId));
  const userActivity = await db
    .select()
    .from(activityLog)
    .where(eq(activityLog.userId, userId))
    .orderBy(desc(activityLog.timestamp))
    .limit(50);

  res.json({
    user: { id: user.id, username: user.username, role: user.role, isPro: user.isPro, createdAt: user.createdAt.toISOString() },
    player: player
      ? {
          ...player,
          equippedSkills: JSON.parse(player.equippedSkills || "[]"),
          createdAt: player.createdAt.toISOString(),
        }
      : null,
    goals: userGoals.map((g) => ({ ...g, createdAt: g.createdAt.toISOString(), completedAt: g.completedAt?.toISOString() ?? null, deadline: g.deadline?.toISOString() ?? null })),
    habits: userHabits.map((h) => ({ ...h, createdAt: h.createdAt.toISOString(), lastCheckin: h.lastCheckin?.toISOString() ?? null })),
    items: userItems.map((i) => ({ ...i, obtainedAt: i.obtainedAt.toISOString() })),
    activity: userActivity.map((a) => ({ ...a, timestamp: a.timestamp.toISOString() })),
  });
});

router.patch("/users/:userId", async (req, res) => {
  const userId = req.params.userId as string;
  const { username, role, isPro } = req.body;
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const updates: Record<string, any> = {};
  if (username !== undefined) updates.username = username;
  if (role !== undefined) updates.role = role;
  if (isPro !== undefined) updates.isPro = isPro;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [updated] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
  res.json({ id: updated.id, username: updated.username, role: updated.role, isPro: updated.isPro, createdAt: updated.createdAt.toISOString() });
});

router.delete("/users/:userId", async (req, res) => {
  const userId = req.params.userId as string;
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (user.role === "admin") {
    res.status(400).json({ error: "Cannot delete admin users" });
    return;
  }
  await db.delete(users).where(eq(users.id, userId));
  res.json({ message: "User deleted" });
});

router.patch("/users/:userId/player", async (req, res) => {
  const userId = req.params.userId as string;
  const [player] = await db.select().from(players).where(eq(players.userId, userId));
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  const allowed = ["level", "xp", "hp", "maxHp", "gold", "strength", "endurance", "dexterity", "faith", "avatarClass", "equippedSkills"];
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates[key] = key === "equippedSkills" ? JSON.stringify(req.body[key]) : req.body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [updated] = await db.update(players).set(updates).where(eq(players.userId, userId)).returning();
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  res.json({
    id: updated.id,
    userId: updated.userId,
    username: user.username,
    level: updated.level,
    xp: updated.xp,
    hp: updated.hp,
    maxHp: updated.maxHp,
    gold: updated.gold,
    strength: updated.strength,
    endurance: updated.endurance,
    dexterity: updated.dexterity,
    faith: updated.faith,
    avatarClass: updated.avatarClass,
    equippedSkills: JSON.parse(updated.equippedSkills || "[]"),
    createdAt: updated.createdAt.toISOString(),
  });
});

router.get("/bosses", async (_req, res) => {
  const allBosses = await db.select().from(bosses).orderBy(desc(bosses.createdAt));
  res.json(allBosses.map((b) => ({ ...b, lootTable: JSON.parse(b.lootTable || "[]"), createdAt: b.createdAt.toISOString() })));
});

router.post("/bosses", async (req, res) => {
  const { name, description, difficulty, maxHp, xpReward, goldReward, lootTable, imageUrl, isCustom } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  const [boss] = await db
    .insert(bosses)
    .values({
      name,
      description: description || "",
      difficulty: difficulty || "medium",
      maxHp: maxHp || 1000,
      xpReward: xpReward || 500,
      goldReward: goldReward || 100,
      lootTable: JSON.stringify(lootTable || []),
      imageUrl: imageUrl || null,
      isCustom: isCustom ?? false,
    })
    .returning();
  res.status(201).json({ ...boss, lootTable: JSON.parse(boss.lootTable || "[]"), createdAt: boss.createdAt.toISOString() });
});

router.patch("/bosses/:bossId", async (req, res) => {
  const bossId = req.params.bossId as string;
  const [boss] = await db.select().from(bosses).where(eq(bosses.id, bossId));
  if (!boss) {
    res.status(404).json({ error: "Boss not found" });
    return;
  }

  const allowed = ["name", "description", "difficulty", "maxHp", "xpReward", "goldReward", "imageUrl", "isCustom"];
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (req.body.lootTable !== undefined) updates.lootTable = JSON.stringify(req.body.lootTable);

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [updated] = await db.update(bosses).set(updates).where(eq(bosses.id, bossId)).returning();
  res.json({ ...updated, lootTable: JSON.parse(updated.lootTable || "[]"), createdAt: updated.createdAt.toISOString() });
});

router.delete("/bosses/:bossId", async (req, res) => {
  const bossId = req.params.bossId as string;
  const [boss] = await db.select().from(bosses).where(eq(bosses.id, bossId));
  if (!boss) {
    res.status(404).json({ error: "Boss not found" });
    return;
  }
  await db.delete(bosses).where(eq(bosses.id, bossId));
  res.json({ message: "Boss deleted" });
});

router.get("/skills", async (_req, res) => {
  const allSkills = await db.select().from(skillDefinitions).orderBy(skillDefinitions.levelRequired, skillDefinitions.id);
  res.json(allSkills);
});

router.post("/skills", async (req, res) => {
  const { name, description, effect, levelRequired } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  const [skill] = await db
    .insert(skillDefinitions)
    .values({
      name,
      description: description || "",
      effect: effect || "",
      levelRequired: levelRequired || 1,
    })
    .returning();
  res.status(201).json(skill);
});

router.patch("/skills/:skillId", async (req, res) => {
  const skillId = req.params.skillId as string;
  const [skill] = await db.select().from(skillDefinitions).where(eq(skillDefinitions.id, skillId));
  if (!skill) {
    res.status(404).json({ error: "Skill not found" });
    return;
  }

  const allowed = ["name", "description", "effect", "levelRequired"];
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [updated] = await db.update(skillDefinitions).set(updates).where(eq(skillDefinitions.id, skillId)).returning();
  res.json(updated);
});

router.delete("/skills/:skillId", async (req, res) => {
  const skillId = req.params.skillId as string;
  const [skill] = await db.select().from(skillDefinitions).where(eq(skillDefinitions.id, skillId));
  if (!skill) {
    res.status(404).json({ error: "Skill not found" });
    return;
  }
  await db.delete(skillDefinitions).where(eq(skillDefinitions.id, skillId));
  res.json({ message: "Skill deleted" });
});

router.get("/items", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;
  const rarity = req.query.rarity as string | undefined;
  const type = req.query.type as string | undefined;

  let query = db
    .select({
      id: inventoryItems.id,
      userId: inventoryItems.userId,
      name: inventoryItems.name,
      description: inventoryItems.description,
      rarity: inventoryItems.rarity,
      type: inventoryItems.type,
      obtainedAt: inventoryItems.obtainedAt,
      username: users.username,
    })
    .from(inventoryItems)
    .innerJoin(users, eq(inventoryItems.userId, users.id))
    .$dynamic();

  const conditions = [];
  if (rarity) conditions.push(eq(inventoryItems.rarity, rarity));
  if (type) conditions.push(eq(inventoryItems.type, type));
  if (conditions.length > 0) {
    query = query.where(conditions.length === 1 ? conditions[0] : sql.join(conditions, sql` AND `));
  }

  const items = await query.orderBy(desc(inventoryItems.obtainedAt)).limit(limit).offset(offset);

  let countQuery = db.select({ value: count() }).from(inventoryItems).$dynamic();
  if (conditions.length > 0) {
    countQuery = countQuery.where(conditions.length === 1 ? conditions[0] : sql.join(conditions, sql` AND `));
  }
  const [{ value: total }] = await countQuery;

  res.json({
    items: items.map((i) => ({ ...i, obtainedAt: i.obtainedAt.toISOString() })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

router.post("/items", async (req, res) => {
  const { userId, name, description, rarity, type } = req.body;
  if (!userId || !name) {
    res.status(400).json({ error: "userId and name are required" });
    return;
  }
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const [item] = await db
    .insert(inventoryItems)
    .values({
      userId,
      name,
      description: description || "",
      rarity: rarity || "common",
      type: type || "trophy",
    })
    .returning();
  res.status(201).json({ ...item, obtainedAt: item.obtainedAt.toISOString() });
});

router.delete("/items/:itemId", async (req, res) => {
  const itemId = req.params.itemId as string;
  const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId));
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  await db.delete(inventoryItems).where(eq(inventoryItems.id, itemId));
  res.json({ message: "Item deleted" });
});

export default router;
