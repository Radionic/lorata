import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { tasksTable } from "./task";
import { relations } from "drizzle-orm";
import {
  TextToImageTaskItemData,
  TextToVideoTaskItemData,
  ImageToVideoTaskItemData,
  ImageEditingTaskItemData,
} from "@/lib/types";
import { taskItemTagsTable } from "./tag";

export const taskItemsTable = sqliteTable(
  "task_items",
  {
    id: text("id").primaryKey(),
    taskId: text("task_id")
      .notNull()
      .references(() => tasksTable.id, { onDelete: "cascade" }),
    data: text("data", { mode: "json" })
      .$type<
        | TextToImageTaskItemData
        | TextToVideoTaskItemData
        | ImageToVideoTaskItemData
        | ImageEditingTaskItemData
      >()
      .notNull(),
    locked: integer("locked", { mode: "boolean" }).notNull().default(false),
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

export const taskItemsRelations = relations(
  taskItemsTable,
  ({ one, many }) => ({
    task: one(tasksTable, {
      fields: [taskItemsTable.taskId],
      references: [tasksTable.id],
    }),
    taskItemTags: many(taskItemTagsTable),
  })
);

export type TaskItem = typeof taskItemsTable.$inferSelect;
