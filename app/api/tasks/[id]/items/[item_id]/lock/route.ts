import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { taskItemsTable } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; item_id: string } }
) {
  const taskId = (await params).id;
  const itemId = (await params).item_id;
  const { locked } = await request.json();

  if (!taskId || !itemId || typeof locked !== "boolean") {
    return NextResponse.json(
      { error: "taskId, itemId, and locked are required" },
      { status: 400 }
    );
  }

  await db
    .update(taskItemsTable)
    .set({
      locked,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(eq(taskItemsTable.id, itemId), eq(taskItemsTable.taskId, taskId))
    );
  return NextResponse.json({});
}
