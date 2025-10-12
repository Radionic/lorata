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

  const body = await request.json().catch(() => ({}));
  const { itemsData } = body as {
    itemsData?: Partial<TaskItem["data"]>[];
  };

  const [{ taskType }] = await db
    .select({ taskType: tasksTable.type })
    .from(tasksTable)
    .where(eq(tasksTable.id, taskId))
    .limit(1);

  const createItem = (data?: Partial<TaskItem["data"]>): TaskItem => {
    const itemId = nanoid();
    const now = new Date().toISOString();

    return match(taskType)
      .with("image-editing", () => ({
        id: itemId,
        taskId,
        data: {
          sourceImages: [],
          targetImage: null,
          instruction: "",
          ...data,
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
          ...data,
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
          ...data,
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
          ...data,
        },
        locked: false,
        createdAt: now,
        updatedAt: now,
      }))
      .exhaustive() as TaskItem;
  };

  const newItems =
    itemsData && itemsData.length > 0
      ? itemsData.map((data) => createItem(data))
      : [createItem()];

  await db.insert(taskItemsTable).values(newItems);

  return NextResponse.json({}, { status: 201 });
}
