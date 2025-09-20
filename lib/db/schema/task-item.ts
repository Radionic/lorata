import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { tasksTable } from "./task";

export const taskItemsTable = sqliteTable(
  "task_items",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => tasksTable.id, { onDelete: "cascade" }),
    data: text("data", { mode: "json" }).notNull(),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    taskIdIdx: index("task_id_idx").on(table.taskId),
  })
);

export type TaskItem = typeof taskItemsTable.$inferSelect;
