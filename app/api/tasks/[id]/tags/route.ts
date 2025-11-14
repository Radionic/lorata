import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tagsTable, taskItemTagsTable, taskItemsTable } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const taskId = (await params).id;
  if (!taskId) {
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
  }

  // Get all unique tags used in this task's items with their usage count
  const tags = await db
    .select({
      id: tagsTable.id,
      name: tagsTable.name,
      count: sql<number>`COUNT(DISTINCT ${taskItemTagsTable.taskItemId})`.as(
        "count"
      ),
    })
    .from(tagsTable)
    .innerJoin(taskItemTagsTable, eq(tagsTable.id, taskItemTagsTable.tagId))
    .innerJoin(
      taskItemsTable,
      eq(taskItemTagsTable.taskItemId, taskItemsTable.id)
    )
    .where(eq(taskItemsTable.taskId, taskId))
    .groupBy(tagsTable.id, tagsTable.name)
    .orderBy(tagsTable.name);

  return NextResponse.json({ tags });
}
