import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const skillDefinitions = pgTable("skill_definitions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  effect: text("effect").notNull().default(""),
  levelRequired: integer("level_required").notNull().default(1),
});

export const insertSkillDefinitionSchema = createInsertSchema(skillDefinitions).omit({ id: true });
export type InsertSkillDefinition = z.infer<typeof insertSkillDefinitionSchema>;
export type SkillDefinition = typeof skillDefinitions.$inferSelect;
