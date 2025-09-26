import { aiProvider } from "@/lib/ai";
import { db } from "@/lib/db";
import { taskItemsTable } from "@/lib/db/schema";
import { generateText } from "ai";
import { eq } from "drizzle-orm";
import { extractFrames } from "@/lib/video";
import path from "path";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { match } from "ts-pattern";
import {
  ImageEditingTaskItem,
  ImageToVideoTaskItem,
  TextToImageTaskItem,
  TextToVideoTaskItem,
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
    videoOptions,
  }: { prompt: string; itemId: string; videoOptions?: VideoOptions } =
    await req.json();
  if (!itemId) {
    throw new Error("Missing itemId");
  }

  const item = await db.query.taskItemsTable.findFirst({
    with: { task: true },
    where: eq(taskItemsTable.id, itemId),
  });
  if (!item) {
    throw new Error("Item not found");
  }

  const getBase64Image = async (absPath: string) => {
    const ext = path.extname(absPath).toLowerCase();
    const mime = ext === ".png" ? "image/png" : "image/jpeg";
    const buf = await readFile(absPath);
    return `data:${mime};base64,${buf.toString("base64")}`;
  };

  const resolveMedia = async (filename?: string, isVideo: boolean = false) => {
    const mediaPath = filename
      ? path.resolve("data", item.taskId, filename)
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

  const taskType = item.task.type;
  const base64Images: string[] = await match(taskType)
    .with("image-editing", async () => {
      const { sourceImage, targetImage } =
        item.data as ImageEditingTaskItem["data"];
      const s = await resolveMedia(sourceImage);
      const t = await resolveMedia(targetImage);
      if (s && t) {
        return [...s, ...t];
      }
      return [];
    })
    .with("text-to-image", async () => {
      const { image } = item.data as TextToImageTaskItem["data"];
      return (await resolveMedia(image)) || [];
    })
    .with("text-to-video", async () => {
      const { video } = item.data as TextToVideoTaskItem["data"];
      return (await resolveMedia(video, true)) || [];
    })
    .with("image-to-video", async () => {
      const { sourceImage, targetVideo } =
        item.data as ImageToVideoTaskItem["data"];
      const s = await resolveMedia(sourceImage);
      const v = await resolveMedia(targetVideo, true);
      if (s && v) {
        return [...s, ...v];
      }
      return [];
    })
    .exhaustive();

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
        ...(item.data || {}),
        instruction: text,
      },
    })
    .where(eq(taskItemsTable.id, itemId));

  return NextResponse.json({});
}
