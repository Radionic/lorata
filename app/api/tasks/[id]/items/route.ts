import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TaskItem, taskItemsTable, tasksTable } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { match } from "ts-pattern";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const taskId = (await params).id;
  if (!taskId) {
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
  }

  const items = await db
    .select()
    .from(taskItemsTable)
    .where(eq(taskItemsTable.taskId, taskId))
    .orderBy(desc(taskItemsTable.createdAt));

  return NextResponse.json({ items });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const taskId = (await params).id;
  if (!taskId) {
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
  }

  const [{ taskType }] = await db
    .select({ taskType: tasksTable.type })
    .from(tasksTable)
    .where(eq(tasksTable.id, taskId))
    .limit(1);

  const itemId = nanoid();
  const now = new Date().toISOString();
  const newItem: TaskItem = match(taskType)
    .with("image-editing", () => ({
      id: itemId,
      taskId,
      data: {
        sourceImages: [],
        targetImage: null,
        instruction: "",
      },
      locked: false,
      createdAt: now,
      updatedAt: now,
    }))
    .with("text-to-image", () => ({
      id: itemId,
      taskId,
      data: {
        image: null,
        instruction: "",
      },
      locked: false,
      createdAt: now,
      updatedAt: now,
    }))
    .with("text-to-video", () => ({
      id: itemId,
      taskId,
      data: {
        video: null,
        instruction: "",
      },
      locked: false,
      createdAt: now,
      updatedAt: now,
    }))
    .with("image-to-video", () => ({
      id: itemId,
      taskId,
      data: {
        sourceImage: null,
        targetVideo: null,
        instruction: "",
      },
      locked: false,
      createdAt: now,
      updatedAt: now,
    }))
    .exhaustive();

  await db.insert(taskItemsTable).values(newItem);
  return NextResponse.json({ item: newItem }, { status: 201 });
}
