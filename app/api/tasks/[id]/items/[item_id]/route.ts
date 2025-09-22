import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { taskItemsTable, tasksTable } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  ImageEditingTaskItem,
  TextToVideoTaskItem,
  ImageToVideoTaskItem,
} from "@/lib/types";
import path from "path";
import { unlinkSync } from "fs";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; item_id: string } }
) {
  const taskId = (await params).id;
  const itemId = (await params).item_id;
  const data = await request.json();

  if (!taskId || !itemId || !data) {
    return NextResponse.json(
      { error: "taskId, itemId, and data are required" },
      { status: 400 }
    );
  }

  const [{ oldData }] = await db
    .select({ oldData: taskItemsTable.data })
    .from(taskItemsTable)
    .where(
      and(eq(taskItemsTable.id, itemId), eq(taskItemsTable.taskId, taskId))
    )
    .limit(1);

  if (!oldData) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const [updatedItem] = await db
    .update(taskItemsTable)
    .set({
      data: {
        ...oldData,
        ...data,
      },
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(eq(taskItemsTable.id, itemId), eq(taskItemsTable.taskId, taskId))
    )
    .returning();

  return NextResponse.json({ item: updatedItem });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; item_id: string } }
) {
  const taskId = (await params).id;
  const itemId = (await params).item_id;

  if (!taskId || !itemId) {
    return NextResponse.json(
      { error: "taskId and itemId are required" },
      { status: 400 }
    );
  }

  const [deletedItem] = await db
    .delete(taskItemsTable)
    .where(
      and(eq(taskItemsTable.id, itemId), eq(taskItemsTable.taskId, taskId))
    )
    .returning();

  if (!deletedItem) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const [{ taskType }] = await db
    .select({ taskType: tasksTable.type })
    .from(tasksTable)
    .where(eq(tasksTable.id, taskId))
    .limit(1);

  if (taskType === "image-editing") {
    const { sourceImage, targetImage } = (deletedItem as ImageEditingTaskItem)
      .data;
    if (typeof sourceImage === "string") {
      const sourceImagePath = path.resolve("data", taskId, sourceImage);
      unlinkSync(sourceImagePath);
    }
    if (typeof targetImage === "string") {
      const targetImagePath = path.resolve("data", taskId, targetImage);
      unlinkSync(targetImagePath);
    }
  } else if (taskType === "text-to-video") {
    const { video } = (deletedItem as TextToVideoTaskItem).data;
    if (typeof video === "string") {
      const videoPath = path.resolve("data", taskId, video);
      unlinkSync(videoPath);
    }
  } else if (taskType === "image-to-video") {
    const { sourceImage, targetVideo } = (deletedItem as ImageToVideoTaskItem)
      .data;
    if (typeof sourceImage === "string") {
      const sourceImagePath = path.resolve("data", taskId, sourceImage);
      unlinkSync(sourceImagePath);
    }
    if (typeof targetVideo === "string") {
      const targetVideoPath = path.resolve("data", taskId, targetVideo);
      unlinkSync(targetVideoPath);
    }
  }

  return NextResponse.json({ success: true });
}
