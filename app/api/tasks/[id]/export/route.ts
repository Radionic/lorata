import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { tasksTable, taskItemsTable } from "@/lib/db/schema";
import {
  ImageEditingTaskItem,
  TextToImageTaskItem,
  TextToVideoTaskItem,
  ImageToVideoTaskItem,
} from "@/lib/types";
import archiver from "archiver";
import { match } from "ts-pattern";
import { convertVideo, extractFirstFrame } from "@/lib/video";
import { getImagePathInfo, ImagePathInfo } from "@/lib/path-helpers";
import { mkdir, rm } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

function applyAffixes(
  instruction: string,
  prefix?: string | null,
  suffix?: string | null
): string {
  return `${prefix || ""}${instruction}${suffix || ""}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const taskId = (await params).id;
  if (!taskId) {
    return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
  }

  const body = await request.json();
  const fps = body?.fps ? parseFloat(body.fps) : undefined;
  const crf = body?.crf ? parseFloat(body.crf) : undefined;
  const preset = body?.preset;
  const useFirstFrame = body?.useFirstFrame ?? false;

  const [task] = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.id, taskId))
    .limit(1);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const prefix = task.prefix;
  const suffix = task.suffix;

  const items = await db
    .select()
    .from(taskItemsTable)
    .where(eq(taskItemsTable.taskId, taskId));
  if (items.length === 0) {
    return NextResponse.json(
      { error: "No items found for this task" },
      { status: 404 }
    );
  }

  const archive = archiver("zip", {
    zlib: { level: 1 },
  });
  const chunks: Buffer[] = [];
  const zipPromise = new Promise<Buffer>((resolve, reject) => {
    archive.on("data", (chunk) => {
      chunks.push(chunk);
    });

    archive.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    archive.on("error", (err) => {
      reject(err);
    });
  });

  // Create a temp directory for export
  const tempDir = path.resolve("data", taskId, "tmp_export");
  try {
    await mkdir(tempDir, { recursive: true });

    await match(task.type)
      .with("image-editing", async () => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i] as ImageEditingTaskItem;
          const itemData = item.data;
          if (
            !itemData.instruction ||
            !itemData.sourceImages ||
            itemData.sourceImages.length === 0 ||
            !itemData.targetImage
          )
            continue;

          // Use the first source image as the base name
          const firstSourceImage = itemData.sourceImages[0] as string;
          const firstSourceImageInfo = getImagePathInfo(
            task.id,
            firstSourceImage
          );

          // Add all source images
          for (let i = 0; i < itemData.sourceImages.length; i++) {
            const sourceImage = itemData.sourceImages[i] as string;
            const sourceImageInfo = getImagePathInfo(task.id, sourceImage);
            archive.file(sourceImageInfo.absolutePath, {
              name: `sources_${i}/${firstSourceImageInfo.name}${sourceImageInfo.extension}`,
            });
          }

          const targetImage = itemData.targetImage as string;
          const targetImageInfo = getImagePathInfo(task.id, targetImage);

          archive.file(targetImageInfo.absolutePath, {
            name: `targets/${firstSourceImageInfo.name}${targetImageInfo.extension}`,
          });

          archive.append(applyAffixes(itemData.instruction, prefix, suffix), {
            name: `instructions/${firstSourceImageInfo.name}.txt`,
          });
        }
      })
      .with("text-to-image", async () => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i] as TextToImageTaskItem;
          const itemData = item.data;
          if (!itemData.image || !itemData.instruction) continue;

          const image = itemData.image as string;
          const imageInfo = getImagePathInfo(task.id, image);

          archive.file(imageInfo.absolutePath, {
            name: `images/${image}`,
          });
          archive.append(applyAffixes(itemData.instruction, prefix, suffix), {
            name: `instructions/${imageInfo.name}.txt`,
          });
        }
      })
      .with("text-to-video", async () => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i] as TextToVideoTaskItem;
          const itemData = item.data;
          if (!itemData.video || !itemData.instruction) continue;

          const video = itemData.video as string;
          const videoInfo = getImagePathInfo(task.id, video);

          const videoPath = fps
            ? await convertVideo({
                inputPath: videoInfo.absolutePath,
                fps,
                crf,
                preset,
              })
            : videoInfo.absolutePath;
          archive.file(videoPath, {
            name: `videos/${video}`,
          });
          archive.append(applyAffixes(itemData.instruction, prefix, suffix), {
            name: `instructions/${videoInfo.name}.txt`,
          });
        }
      })
      .with("image-to-video", async () => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i] as ImageToVideoTaskItem;
          const itemData = item.data;
          if (
            (!itemData.sourceImage && !useFirstFrame) ||
            !itemData.targetVideo ||
            !itemData.instruction
          )
            continue;

          const targetInfo = getImagePathInfo(task.id, itemData.targetVideo);
          let sourceInfo: ImagePathInfo;

          if (useFirstFrame) {
            // Extract first frame from target video
            const framePath = path.join(tempDir, `frame_${i}.jpg`);
            await extractFirstFrame(targetInfo.absolutePath, framePath);
            sourceInfo = {
              absolutePath: framePath,
              extension: ".jpg",
              name: `frame_${i}`,
            };
          } else {
            // Use the existing source image
            const sourceImage = itemData.sourceImage as string;
            sourceInfo = getImagePathInfo(task.id, sourceImage);
          }

          archive.file(sourceInfo.absolutePath, {
            name: `sources/${sourceInfo.name}${sourceInfo.extension}`,
          });

          const targetPath = fps
            ? await convertVideo({
                inputPath: targetInfo.absolutePath,
                fps,
                crf,
                preset,
              })
            : targetInfo.absolutePath;
          archive.file(targetPath, {
            name: `targets/${sourceInfo.name}${targetInfo.extension}`,
          });
          archive.append(applyAffixes(itemData.instruction, prefix, suffix), {
            name: `instructions/${sourceInfo.name}.txt`,
          });
        }
      })
      .exhaustive();

    archive.finalize();

    const zipBuffer = await zipPromise;
    const filename = `export-${task.name}-${Date.now()}.zip`;

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Length": zipBuffer.length.toString(),
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } finally {
    // Clean up temp directory after processing
    if (existsSync(tempDir)) {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
}
