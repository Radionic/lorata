import { sqliteTable, text } from "drizzle-orm/sqlite-core";

const taskType = [
  "text-to-image",
  "image-editing",
  "text-to-video",
  "image-to-video",
] as const;

export const tasksTable = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text({ enum: taskType }).notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export type Task = typeof tasksTable.$inferSelect;
