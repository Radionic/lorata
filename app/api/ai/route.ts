import { aiProvider } from "@/lib/ai";
import { db } from "@/lib/db";
import { taskItemsTable, tagsTable, taskItemTagsTable } from "@/lib/db/schema";
import type { TaskItem } from "@/lib/db/schema";
import { generateText } from "ai";
import { eq, inArray } from "drizzle-orm";
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
import { nanoid } from "nanoid";

export type VideoOptions = {
  numFrames: number;
  interval: number;
};

export type MediaSelection = {
  // For image-editing tasks
  sourceImage1?: boolean;
  sourceImage2?: boolean;
  sourceImage3?: boolean;
  targetImage?: boolean;
  // For image-to-video tasks
  sourceImage?: boolean;
  targetVideo?: boolean;
};

export async function POST(req: Request) {
  const {
    prompt,
    itemId,
    taskId,
    overwrite,
    videoOptions,
    mediaSelection,
    operation,
  }: {
    prompt: string;
    itemId?: string;
    taskId?: string;
    overwrite?: boolean;
    videoOptions?: VideoOptions;
    mediaSelection?: MediaSelection;
    operation?: "caption" | "tag";
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

        const imagesToProcess: string[] = [];

        // Add images based on selection
        if (mediaSelection?.sourceImage1 && sourceImages[0]) {
          imagesToProcess.push(sourceImages[0]);
        }
        if (mediaSelection?.sourceImage2 && sourceImages[1]) {
          imagesToProcess.push(sourceImages[1]);
        }
        if (mediaSelection?.sourceImage3 && sourceImages[2]) {
          imagesToProcess.push(sourceImages[2]);
        }
        if (mediaSelection?.targetImage) {
          imagesToProcess.push(targetImage);
        }

        const images = (
          await Promise.all(imagesToProcess.map((i) => resolveMedia(i)))
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
        const s = mediaSelection?.sourceImage
          ? await resolveMedia(sourceImage)
          : undefined;
        const v = mediaSelection?.targetVideo
          ? await resolveMedia(targetVideo, true)
          : undefined;
        return [...(s || []), ...(v || [])];
      })
      .exhaustive();
  };

  // TODO: Concurrent processing?
  for (const item of items) {
    if (!item) continue;

    const isLocked = item.locked;

    if (operation === "caption") {
      const hasInstruction = !!item?.data?.instruction;
      // For dataset-level generation, skip items with existing instruction unless overwriting.
      // For single-item generation, always overwrite regardless of overwrite setting.
      if (isLocked || (hasInstruction && !overwrite && !itemId)) {
        continue;
      }
    } else if (operation === "tag") {
      const existingTags = await db
        .select()
        .from(taskItemTagsTable)
        .where(eq(taskItemTagsTable.taskItemId, item.id));

      const hasTags = existingTags.length > 0;
      // Skip locked items or items with existing tags unless overwriting
      if (isLocked || (hasTags && !overwrite)) {
        continue;
      }

      if (overwrite && hasTags) {
        await db
          .delete(taskItemTagsTable)
          .where(eq(taskItemTagsTable.taskItemId, item.id));
      }
    }

    const base64Images: string[] = await getBase64ImagesForItem(item);
    if (base64Images.length === 0) {
      continue;
    }

    const { text, finishReason } = await generateText({
      model: aiProvider(process.env.OPENAI_API_MODEL!),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...base64Images.map((image) => ({
              type: "image" as const,
              image,
            })),
          ],
        },
      ],
    });

    if (finishReason !== "stop") {
      console.warn("Generation did not complete, finish reason:", finishReason);
      continue;
    }

    if (operation === "caption") {
      await db
        .update(taskItemsTable)
        .set({
          data: {
            ...item.data,
            instruction: text,
          },
        })
        .where(eq(taskItemsTable.id, item.id));
    } else if (operation === "tag") {
      const tagNames = text
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      if (tagNames.length === 0) continue;

      // Bulk upsert tags
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

      // Fetch all tag IDs
      const tags = await db
        .select({ id: tagsTable.id, name: tagsTable.name })
        .from(tagsTable)
        .where(inArray(tagsTable.name, tagNames));

      // Bulk insert junction table entries
      await db
        .insert(taskItemTagsTable)
        .values(
          tags.map((tag) => ({
            taskItemId: item.id,
            tagId: tag.id,
          }))
        )
        .onConflictDoNothing();
    }
  }

  return NextResponse.json({});
}
