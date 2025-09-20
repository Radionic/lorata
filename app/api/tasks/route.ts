import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { count, desc, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { taskItemsTable, tasksTable } from "@/lib/db/schema";

export async function GET() {
  const tasks = await db
    .select()
    .from(tasksTable)
    .orderBy(desc(tasksTable.createdAt));
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
