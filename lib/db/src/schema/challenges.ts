import { pgTable, text, uuid, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { users } from "./users";
import { goals } from "./goals";

export const challenges = pgTable("challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  goalId: uuid("goal_id").references(() => goals.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  duration: text("duration").notNull().default("daily"),
  difficulty: text("difficulty").notNull().default("medium"),
  xpReward: integer("xp_reward").notNull().default(50),
  status: text("status").notNull().default("active"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertChallengeSchema = createInsertSchema(challenges).omit({ id: true, createdAt: true, completedAt: true });
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challenges.$inferSelect;
