import { aiProvider } from "@/lib/ai";
import { db } from "@/lib/db";
import { taskItemsTable } from "@/lib/db/schema";
import type { TaskItem } from "@/lib/db/schema";
import { generateText } from "ai";
import { eq } from "drizzle-orm";
import { extractFrames } from "@/lib/video";
import path from "path";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { match } from "ts-pattern";
import {
  ImageEditingTaskItemData,
  ImageToVideoTaskItemData,
  TextToImageTaskItemData,
  TextToVideoTaskItemData,
} from "@/lib/types";
import { NextResponse } from "next/server";

export type VideoOptions = {
  numFrames: number;
  interval: number;
};

export async function POST(req: Request) {
  const {
    prompt,
    itemId,
    taskId,
    overwriteInstruction,
    videoOptions,
  }: {
    prompt: string;
    itemId?: string;
    taskId?: string;
    overwriteInstruction?: boolean;
    videoOptions?: VideoOptions;
  } = await req.json();

  if (!itemId && !taskId) {
    throw new Error("itemId or taskId is required");
  }

  // Fetch items to process
  const items = itemId
    ? [
        await db.query.taskItemsTable.findFirst({
          with: { task: true },
          where: eq(taskItemsTable.id, itemId),
        }),
      ]
    : await db.query.taskItemsTable.findMany({
        with: { task: true },
        where: eq(taskItemsTable.taskId, taskId!),
      });

  if (!items[0]) {
    throw new Error("No items found");
  }

  const _taskId = items[0].taskId;
  const taskType = items[0].task.type;

  const getBase64Image = async (absPath: string) => {
    const ext = path.extname(absPath).toLowerCase();
    const mime = ext === ".png" ? "image/png" : "image/jpeg";
    const buf = await readFile(absPath);
    return `data:${mime};base64,${buf.toString("base64")}`;
  };

  const resolveMedia = async (
    filename?: string | null,
    isVideo: boolean = false
  ) => {
    const mediaPath = filename
      ? path.resolve("data", _taskId, filename)
      : undefined;
    if (!mediaPath || !existsSync(mediaPath)) return undefined;

    const imagePaths: string[] = [];
    if (isVideo) {
      const frames = await extractFrames(
        mediaPath,
        videoOptions?.numFrames ?? 5,
        videoOptions?.interval ?? 1
      );
      imagePaths.push(...frames);
    } else {
      imagePaths.push(mediaPath);
    }
    return await Promise.all(imagePaths.map(getBase64Image));
  };

  const getBase64ImagesForItem = async (it: TaskItem) => {
    return await match(taskType)
      .with("image-editing", async () => {
        const { sourceImages, targetImage } =
          it.data as ImageEditingTaskItemData;
        if (!sourceImages || !targetImage) return [];

        const images = (
          await Promise.all(
            [...sourceImages, targetImage].map((i) => resolveMedia(i))
          )
        )
          .flat()
          .filter((s) => s !== undefined);
        return images;
      })
      .with("text-to-image", async () => {
        const { image } = it.data as TextToImageTaskItemData;
        return (await resolveMedia(image)) || [];
      })
      .with("text-to-video", async () => {
        const { video } = it.data as TextToVideoTaskItemData;
        return (await resolveMedia(video, true)) || [];
      })
      .with("image-to-video", async () => {
        const { sourceImage, targetVideo } =
          it.data as ImageToVideoTaskItemData;
        const s = await resolveMedia(sourceImage);
        const v = await resolveMedia(targetVideo, true);
        if (s && v) return [...s, ...v];
        return [];
      })
      .exhaustive();
  };

  // TODO: Concurrent processing?
  for (const item of items) {
    if (!item) continue;

    const isLocked = item.locked;
    const hasInstruction = !!item?.data?.instruction;
    // For dataset-level generation, skip items with existing instruction unless overwriting.
    // For single-item generation, always overwrite regardless of overwriteInstruction.
    if (isLocked || (hasInstruction && !overwriteInstruction && !itemId)) {
      continue;
    }

    const base64Images: string[] = await getBase64ImagesForItem(item);
    const imageParts = base64Images.map((image) => ({
      type: "image" as const,
      image,
    }));

    const { text } = await generateText({
      model: aiProvider(process.env.OPENAI_API_MODEL!),
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }, ...imageParts],
        },
      ],
    });

    await db
      .update(taskItemsTable)
      .set({
        data: {
          ...item.data,
          instruction: text,
        },
      })
      .where(eq(taskItemsTable.id, item.id));
  }

  return NextResponse.json({});
}
