import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { tasksTable } from "@/lib/db/schema";
import { rmSync, existsSync } from "fs";
import path from "path";

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const taskId = (await params).id;
  if (!taskId) {
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
  }

  await db.delete(tasksTable).where(eq(tasksTable.id, taskId));

  // Remove the data folder for this task
  const dataDir = path.resolve(process.cwd(), "data", taskId);
  if (existsSync(dataDir)) {
    try {
      rmSync(dataDir, { recursive: true, force: true });
      console.log(`Deleted data folder: ${dataDir}`);
    } catch (error) {
      console.error(`Failed to delete data folder ${dataDir}:`, error);
    }
  }

  return NextResponse.json({});
}
