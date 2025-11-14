import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tagsTable, taskTagsTable } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const tags = await db
    .select({
      id: tagsTable.id,
      name: tagsTable.name,
      count: sql<number>`COUNT(DISTINCT ${taskTagsTable.taskId})`.as("count"),
    })
    .from(tagsTable)
    .innerJoin(taskTagsTable, eq(tagsTable.id, taskTagsTable.tagId))
    .groupBy(tagsTable.id, tagsTable.name)
    .orderBy(tagsTable.name);

  return NextResponse.json({ tags });
}
