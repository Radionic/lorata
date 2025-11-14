import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { count, desc, inArray, sql, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { taskItemsTable, tasksTable, taskTagsTable, tagsTable } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tagsParam = searchParams.get("tags");
  const filterTagNames = tagsParam
    ? tagsParam
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  let tasks;

  if (filterTagNames.length === 0) {
    tasks = await db
      .select()
      .from(tasksTable)
      .orderBy(desc(tasksTable.createdAt));
  } else {
    const taggedTasks = await db
      .select({
        taskId: taskTagsTable.taskId,
        count: sql<number>`COUNT(DISTINCT ${tagsTable.name})`.as("count"),
      })
      .from(taskTagsTable)
      .innerJoin(tagsTable, eq(tagsTable.id, taskTagsTable.tagId))
      .where(inArray(tagsTable.name, filterTagNames))
      .groupBy(taskTagsTable.taskId)
      .having(sql`COUNT(DISTINCT ${tagsTable.name}) = ${filterTagNames.length}`);

    const filteredTaskIds = taggedTasks.map((t) => t.taskId);

    if (filteredTaskIds.length === 0) {
      return NextResponse.json({ tasks: [] });
    }

    tasks = await db
      .select()
      .from(tasksTable)
      .where(inArray(tasksTable.id, filteredTaskIds))
      .orderBy(desc(tasksTable.createdAt));
  }
  const taskIds = tasks.map((task) => task.id);
  const taskItemCounts = await db
    .select({
      taskId: taskItemsTable.taskId,
      itemCount: count(taskItemsTable.id),
    })
    .from(taskItemsTable)
    .where(inArray(taskItemsTable.taskId, taskIds))
    .groupBy(taskItemsTable.taskId);

  const countsMap = new Map(taskItemCounts.map((c) => [c.taskId, c.itemCount]));
  return NextResponse.json({
    tasks: tasks.map((task) => ({
      ...task,
      itemCount: countsMap.get(task.id) || 0,
    })),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, type } = body;

  if (!name || !type) {
    return NextResponse.json(
      { error: "Name and type are required" },
      { status: 400 }
    );
  }

  const taskId = nanoid();
  await db.insert(tasksTable).values({
    id: taskId,
    name,
    type,
  });

  return NextResponse.json({ taskId }, { status: 200 });
}
