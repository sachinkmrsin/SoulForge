import { pgTable, text, uuid, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { users } from "./users";

export const players = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  hp: integer("hp").notNull().default(100),
  maxHp: integer("max_hp").notNull().default(100),
  gold: integer("gold").notNull().default(0),
  strength: integer("strength").notNull().default(10),
  endurance: integer("endurance").notNull().default(10),
  dexterity: integer("dexterity").notNull().default(10),
  faith: integer("faith").notNull().default(10),
  avatarClass: text("avatar_class").notNull().default("knight"),
  equippedSkills: text("equipped_skills").notNull().default("[]"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPlayerSchema = createInsertSchema(players).omit({ id: true, createdAt: true });
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;
