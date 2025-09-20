import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { tasksTable } from "@/lib/db/schema";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const taskId = (await params).id;
  if (!taskId) {
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
  }

  const [task] = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.id, taskId))
    .limit(1);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({
    task,
  });
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
  const { name } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Task name is required and must be a non-empty string" },
      { status: 400 }
    );
  }

  await db
    .update(tasksTable)
    .set({
      name: name.trim(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tasksTable.id, taskId));

  return NextResponse.json({});
}
