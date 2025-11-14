import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tagsTable, taskTagsTable } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const taskId = (await params).id;
  if (!taskId) {
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
  }

  const tags = await db
    .select({
      id: tagsTable.id,
      name: tagsTable.name,
    })
    .from(tagsTable)
    .innerJoin(taskTagsTable, eq(tagsTable.id, taskTagsTable.tagId))
    .where(eq(taskTagsTable.taskId, taskId))
    .orderBy(tagsTable.name);

  return NextResponse.json({ tags });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const taskId = (await params).id;
  if (!taskId) {
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
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
    await db.delete(taskTagsTable).where(eq(taskTagsTable.taskId, taskId));
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

  await db.delete(taskTagsTable).where(eq(taskTagsTable.taskId, taskId));

  if (existingTags.length > 0) {
    await db
      .insert(taskTagsTable)
      .values(
        existingTags.map((tag) => ({
          taskId,
          tagId: tag.id,
        }))
      )
      .onConflictDoNothing();
  }

  return NextResponse.json({});
}
