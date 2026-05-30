import { pgTable, text, uuid, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { users } from "./users";

export const bosses = pgTable("bosses", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  difficulty: text("difficulty").notNull().default("medium"),
  maxHp: integer("max_hp").notNull().default(1000),
  xpReward: integer("xp_reward").notNull().default(500),
  goldReward: integer("gold_reward").notNull().default(100),
  lootTable: text("loot_table").notNull().default("[]"),
  imageUrl: text("image_url"),
  isCustom: boolean("is_custom").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("bosses_is_custom_idx").on(table.isCustom),
]);

export const bossBattles = pgTable("boss_battles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bossId: uuid("boss_id").notNull().references(() => bosses.id, { onDelete: "cascade" }),
  currentHp: integer("current_hp").notNull(),
  attackPoints: integer("attack_points").notNull().default(0),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  defeatedAt: timestamp("defeated_at"),
  xpEarned: integer("xp_earned").notNull().default(0),
  goldEarned: integer("gold_earned").notNull().default(0),
}, (table) => [
  index("boss_battles_user_id_defeated_at_idx").on(table.userId, table.defeatedAt),
  index("boss_battles_boss_id_idx").on(table.bossId),
]);

export const insertBossSchema = createInsertSchema(bosses).omit({ id: true, createdAt: true });
export type InsertBoss = z.infer<typeof insertBossSchema>;
export type Boss = typeof bosses.$inferSelect;
export type BossBattle = typeof bossBattles.$inferSelect;
