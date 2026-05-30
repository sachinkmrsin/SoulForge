import { pgTable, text, uuid, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { goals } from "./goals";
import { users } from "./users";

export const subtasks = pgTable("subtasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  goalId: uuid("goal_id").notNull().references(() => goals.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  xpReward: integer("xp_reward").notNull().default(25),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSubtaskSchema = createInsertSchema(subtasks).omit({ id: true, createdAt: true, completedAt: true });
export type InsertSubtask = z.infer<typeof insertSubtaskSchema>;
export type Subtask = typeof subtasks.$inferSelect;
