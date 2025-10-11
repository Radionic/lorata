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
import { convertVideo } from "@/lib/video";
import { getImagePathInfo } from "@/lib/path-helpers";

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

        let filePath = videoInfo.absolutePath;
        if (fps && fps > 0) {
          const converted = await convertVideo({
            inputPath: videoInfo.absolutePath,
            fps,
            crf,
            preset,
          });
          filePath = converted;
        }
        archive.file(filePath, {
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
          !itemData.sourceImage ||
          !itemData.targetVideo ||
          !itemData.instruction
        )
          continue;

        const sourceImage = itemData.sourceImage as string;
        const targetVideo = itemData.targetVideo as string;

        const sourceInfo = getImagePathInfo(task.id, sourceImage);
        const targetInfo = getImagePathInfo(task.id, targetVideo);

        archive.file(sourceInfo.absolutePath, {
          name: `sources/${sourceImage}`,
        });

        let targetPath = targetInfo.absolutePath;
        if (fps && fps > 0) {
          const converted = await convertVideo({
            inputPath: targetInfo.absolutePath,
            fps,
            crf,
            preset,
          });
          targetPath = converted;
        }
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
}
