import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  TaskItem,
  taskItemsTable,
  tasksTable,
  tagsTable,
  taskItemTagsTable,
} from "@/lib/db/schema";
import { eq, desc, exists } from "drizzle-orm";
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

  const { searchParams } = new URL(request.url);
  const tagsParam = searchParams.get("tags");
  const filterTagNames = tagsParam
    ? tagsParam
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  const items = await db.query.taskItemsTable.findMany({
    where: (taskItem, { and, eq, inArray, sql }) => {
      const baseCondition = eq(taskItem.taskId, taskId);

      if (filterTagNames.length === 0) {
        return baseCondition;
      }

      // Build a single correlated subquery over the junction table
      const tagsSubquery = db
        .select({ taskItemId: taskItemTagsTable.taskItemId })
        .from(taskItemTagsTable)
        .innerJoin(tagsTable, eq(tagsTable.id, taskItemTagsTable.tagId))
        .where(
          and(
            eq(taskItemTagsTable.taskItemId, taskItem.id),
            inArray(tagsTable.name, filterTagNames)
          )
        )
        .groupBy(taskItemTagsTable.taskItemId)
        .having(
          sql`COUNT(DISTINCT ${tagsTable.name}) = ${filterTagNames.length}`
        );

      return and(baseCondition, exists(tagsSubquery));
    },
    with: {
      taskItemTags: {
        with: {
          tag: true,
        },
      },
    },
    orderBy: [desc(taskItemsTable.createdAt)],
  });

  return NextResponse.json({
    items: items.map((item) => ({
      ...item,
      tags: item.taskItemTags.map((tt) => ({
        id: tt.tag.id,
        name: tt.tag.name,
      })),
      taskItemTags: undefined, // Remove nested structure
    })),
  });
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
