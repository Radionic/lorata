import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { tasksTable, taskItemsTable } from "@/lib/db/schema";
import { ImageEditingTaskItem, TextToImageTaskItem } from "@/lib/types";
import archiver from "archiver";
import path from "path";
import { match } from "ts-pattern";

interface ImagePathInfo {
  absolutePath: string;
  extension: string;
  name: string;
}

function getImagePathInfo(taskId: string, imagePath: string): ImagePathInfo {
  const absolutePath = path.resolve("data", taskId, imagePath);
  const extension = path.extname(imagePath);
  const name = path.basename(imagePath, extension);

  return {
    absolutePath,
    extension,
    name,
  };
}

export async function POST(
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
          !itemData.sourceImage ||
          !itemData.targetImage
        )
          continue;

        const sourceImage = itemData.sourceImage as string;
        const sourceImageInfo = getImagePathInfo(task.id, sourceImage);

        archive.file(sourceImageInfo.absolutePath, {
          name: `sources/${sourceImage}`,
        });

        const targetImage = itemData.targetImage as string;
        const targetImageInfo = getImagePathInfo(task.id, targetImage);

        archive.file(targetImageInfo.absolutePath, {
          name: `targets/${sourceImageInfo.name}${targetImageInfo.extension}`,
        });

        archive.append(itemData.instruction, {
          name: `instructions/${sourceImageInfo.name}.txt`,
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
        archive.append(itemData.instruction, {
          name: `instructions/${imageInfo.name}.txt`,
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
