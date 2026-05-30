import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { users } from "./users";

export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  rarity: text("rarity").notNull().default("common"),
  type: text("type").notNull().default("trophy"),
  obtainedAt: timestamp("obtained_at").notNull().defaultNow(),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({ id: true, obtainedAt: true });
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;
