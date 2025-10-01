import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { taskItemsTable } from "./task-item";

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
  prefix: text("prefix"),
  suffix: text("suffix"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const tasksRelations = relations(tasksTable, ({ many }) => ({
  taskItems: many(taskItemsTable),
}));

export type Task = typeof tasksTable.$inferSelect;
