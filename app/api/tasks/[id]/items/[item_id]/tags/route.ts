import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tagsTable, taskItemTagsTable, taskItemsTable } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; item_id: string } }
) {
  const taskId = (await params).id;
  const itemId = (await params).item_id;

  if (!taskId || !itemId) {
    return NextResponse.json(
      { error: "Task ID and Item ID are required" },
      { status: 400 }
    );
  }

  const tags = await db
    .select({
      id: tagsTable.id,
      name: tagsTable.name,
    })
    .from(tagsTable)
    .innerJoin(taskItemTagsTable, eq(tagsTable.id, taskItemTagsTable.tagId))
    .innerJoin(
      taskItemsTable,
      eq(taskItemTagsTable.taskItemId, taskItemsTable.id)
    )
    .where(
      and(
        eq(taskItemTagsTable.taskItemId, itemId),
        eq(taskItemsTable.taskId, taskId)
      )
    )
    .orderBy(tagsTable.name);

  return NextResponse.json({ tags });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; item_id: string } }
) {
  const taskId = (await params).id;
  const itemId = (await params).item_id;

  if (!taskId || !itemId) {
    return NextResponse.json(
      { error: "Task ID and Item ID are required" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const tags = (body?.tags as string[] | undefined) || [];

  if (!Array.isArray(tags)) {
    return NextResponse.json(
      { error: "Tags must be an array of strings" },
      { status: 400 }
    );
  }

  const tagNames = Array.from(
    new Set(tags.map((t) => t.trim()).filter((t) => t.length > 0))
  );

  if (tagNames.length === 0) {
    await db
      .delete(taskItemTagsTable)
      .where(eq(taskItemTagsTable.taskItemId, itemId));

    return NextResponse.json({});
  }

  await db
    .insert(tagsTable)
    .values(
      tagNames.map((name) => ({
        id: nanoid(),
        name,
        createdAt: new Date().toISOString(),
      }))
    )
    .onConflictDoNothing();

  const existingTags = await db
    .select({ id: tagsTable.id, name: tagsTable.name })
    .from(tagsTable)
    .where(inArray(tagsTable.name, tagNames));

  await db
    .delete(taskItemTagsTable)
    .where(eq(taskItemTagsTable.taskItemId, itemId));

  if (existingTags.length > 0) {
    await db
      .insert(taskItemTagsTable)
      .values(
        existingTags.map((tag) => ({
          taskItemId: itemId,
          tagId: tag.id,
        }))
      )
      .onConflictDoNothing();
  }

  return NextResponse.json({});
}
