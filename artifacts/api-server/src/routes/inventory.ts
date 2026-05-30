import { Router } from "express";
import { db, inventoryItems } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const items = await db.select().from(inventoryItems).where(eq(inventoryItems.userId, user.id));
  res.json(items.map((l) => ({
    id: l.id,
    userId: l.userId,
    name: l.name,
    description: l.description,
    rarity: l.rarity,
    type: l.type,
    obtainedAt: l.obtainedAt.toISOString(),
  })));
});

router.delete("/:itemId", requireAuth, async (req, res) => {
  const user = (req as any).user;
  const itemId = req.params.itemId as string;
  await db.delete(inventoryItems).where(and(eq(inventoryItems.id, itemId), eq(inventoryItems.userId, user.id)));
  res.json({ message: "Item discarded" });
});

export default router;
