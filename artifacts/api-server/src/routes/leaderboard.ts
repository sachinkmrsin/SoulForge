import { Router } from "express";
import { db, players, users } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const user = (req as any).user;

  const topPlayers = await db
    .select({
      username: users.username,
      level: players.level,
      xp: players.xp,
      avatarClass: players.avatarClass,
    })
    .from(players)
    .innerJoin(users, sql`${players.userId} = ${users.id}`)
    .orderBy(desc(players.level), desc(players.xp))
    .limit(50);

  const entries = topPlayers.map((p, i) => ({
    rank: i + 1,
    username: p.username,
    level: p.level,
    xp: p.xp,
    avatarClass: p.avatarClass,
  }));

  const [currentPlayer] = await db
    .select({
      username: users.username,
      level: players.level,
      xp: players.xp,
      avatarClass: players.avatarClass,
    })
    .from(players)
    .innerJoin(users, sql`${players.userId} = ${users.id}`)
    .where(sql`${players.userId} = ${user.id}`);

  let currentRank: { rank: number; username: string; level: number; xp: number; avatarClass: string } | null = null;

  if (currentPlayer) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(players)
      .where(
        sql`(${players.level} > ${currentPlayer.level}) OR (${players.level} = ${currentPlayer.level} AND ${players.xp} > ${currentPlayer.xp})`
      );

    currentRank = {
      rank: count + 1,
      username: currentPlayer.username,
      level: currentPlayer.level,
      xp: currentPlayer.xp,
      avatarClass: currentPlayer.avatarClass,
    };
  }

  res.json({ entries, currentRank });
});

export default router;
