import { sqliteTable, text, primaryKey, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { taskItemsTable } from "./task-item";

export const tagsTable = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const taskItemTagsTable = sqliteTable(
  "task_item_tags",
  {
    taskItemId: text("task_item_id")
      .notNull()
      .references(() => taskItemsTable.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tagsTable.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.taskItemId, table.tagId] }),
    taskItemIdIdx: index("task_item_tags_task_item_id_idx").on(
      table.taskItemId
    ),
    tagIdIdx: index("task_item_tags_tag_id_idx").on(table.tagId),
  })
);

export const tagsRelations = relations(tagsTable, ({ many }) => ({
  taskItemTags: many(taskItemTagsTable),
}));

export const taskItemTagsRelations = relations(
  taskItemTagsTable,
  ({ one }) => ({
    taskItem: one(taskItemsTable, {
      fields: [taskItemTagsTable.taskItemId],
      references: [taskItemsTable.id],
    }),
    tag: one(tagsTable, {
      fields: [taskItemTagsTable.tagId],
      references: [tagsTable.id],
    }),
  })
);

export type Tag = typeof tagsTable.$inferSelect;
export type TaskItemTag = typeof taskItemTagsTable.$inferSelect;
