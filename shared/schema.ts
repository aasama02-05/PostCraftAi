import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  originalPrompt: text("original_prompt"),
  originalDraft: text("original_draft"),
  tone: text("tone"),
  content: text("content").notNull(),
  variations: jsonb("variations").$type<{ content: string, provider: string, imageUrl?: string }[]>(), // Array of 3 objects
  suggestions: text("suggestions"),
  type: text("type").notNull(), // 'generate' or 'refine'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true });

export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;

export type GenerateRequest = {
  topic: string;
  tone: string;
};

export type RefineRequest = {
  draft: string;
};
