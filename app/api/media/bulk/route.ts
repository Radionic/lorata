import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readdir, readFile, copyFile, rm } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { db } from "@/lib/db";
import { TaskItem, taskItemsTable, tasksTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { match } from "ts-pattern";
import extract from "extract-zip";
import { getImagePathInfo } from "@/lib/path-helpers";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const zipFile = formData.get("files") as File;
  const taskId = formData.get("taskId") as string;

  if (!zipFile || !taskId) {
    return NextResponse.json(
      { error: "Missing required fields: zip file or taskId" },
      { status: 400 }
    );
  }

  if (!zipFile.name.endsWith(".zip")) {
    return NextResponse.json(
      { error: "Only zip files are supported" },
      { status: 400 }
    );
  }

  const [task] = await db
    .select({ taskType: tasksTable.type })
    .from(tasksTable)
    .where(eq(tasksTable.id, taskId))
    .limit(1);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const dataDir = path.join(process.cwd(), "data", taskId);
  if (!existsSync(dataDir)) {
    await mkdir(dataDir, { recursive: true });
  }

  // Save zip temporarily
  const tempZipPath = path.join(dataDir, `temp-${Date.now()}.zip`);
  const tempExtractDir = path.join(dataDir, `temp-extract-${Date.now()}`);

  try {
    // Write zip file
    const zipBytes = await zipFile.arrayBuffer();
    await writeFile(tempZipPath, Buffer.from(zipBytes));

    // Extract zip
    await mkdir(tempExtractDir, { recursive: true });
    await extract(tempZipPath, { dir: tempExtractDir });

    // Read instructions
    const instructionsMap = new Map<string, string>();
    const instructionsDir = path.join(tempExtractDir, "instructions");
    if (existsSync(instructionsDir)) {
      const instructionFiles = await readdir(instructionsDir);
      for (const file of instructionFiles) {
        if (file.endsWith(".txt")) {
          const content = await readFile(
            path.join(instructionsDir, file),
            "utf-8"
          );
          const basename = path.parse(file).name;
          instructionsMap.set(basename, content.trim());
        }
      }
    }

    const taskItemsToCreate: TaskItem[] = [];

    await match(task.taskType)
      .with("text-to-image", async () => {
        const imagesDir = path.join(tempExtractDir, "images");
        if (!existsSync(imagesDir)) {
          throw new Error("Missing 'images' folder in zip file");
        }

        const imageFiles = await readdir(imagesDir);
        for (const imageFile of imageFiles) {
          const pathInfo = getImagePathInfo("", imageFile);
          const instruction = instructionsMap.get(pathInfo.name) || "";

          // Copy image to data directory with short random ID
          const sourcePath = path.join(imagesDir, imageFile);
          const targetName = `${pathInfo.name}${pathInfo.extension}`;
          const targetPath = path.join(dataDir, targetName);
          // Skip if source image already exists
          if (existsSync(targetPath)) {
            console.warn(`Source image already exists: ${targetPath}`);
            continue;
          }
          await copyFile(sourcePath, targetPath);

          const itemId = nanoid();
          const now = new Date().toISOString();
          taskItemsToCreate.push({
            id: itemId,
            taskId,
            data: {
              image: targetName,
              instruction,
            },
            locked: false,
            createdAt: now,
            updatedAt: now,
          });
        }
      })
      .with("text-to-video", async () => {
        const videosDir = path.join(tempExtractDir, "videos");
        if (!existsSync(videosDir)) {
          throw new Error("Missing 'videos' folder in zip file");
        }

        const videoFiles = await readdir(videosDir);
        for (const videoFile of videoFiles) {
          const pathInfo = getImagePathInfo("", videoFile);
          const instruction = instructionsMap.get(pathInfo.name) || "";

          // Copy video to data directory with short random ID
          const sourcePath = path.join(videosDir, videoFile);
          const targetName = `${pathInfo.name}${pathInfo.extension}`;
          const targetPath = path.join(dataDir, targetName);
          // Skip if source video already exists
          if (existsSync(targetPath)) {
            console.warn(`Source video already exists: ${targetPath}`);
            continue;
          }
          await copyFile(sourcePath, targetPath);

          const itemId = nanoid();
          const now = new Date().toISOString();
          taskItemsToCreate.push({
            id: itemId,
            taskId,
            data: {
              video: targetName,
              instruction,
            },
            locked: false,
            createdAt: now,
            updatedAt: now,
          });
        }
      })
      .with("image-to-video", async () => {
        const sourcesDir = path.join(tempExtractDir, "sources");
        const targetsDir = path.join(tempExtractDir, "targets");

        if (!existsSync(sourcesDir) || !existsSync(targetsDir)) {
          throw new Error("Missing 'sources' or 'targets' folder in zip file");
        }

        const sourceFiles = await readdir(sourcesDir);
        for (const sourceFile of sourceFiles) {
          const sourcePathInfo = getImagePathInfo("", sourceFile);
          const instruction = instructionsMap.get(sourcePathInfo.name) || "";

          // Find matching target video
          const targetFiles = await readdir(targetsDir);
          const targetFile = targetFiles.find(
            (f) => getImagePathInfo("", f).name === sourcePathInfo.name
          );

          if (!targetFile) {
            console.warn(`No target video found for source: ${sourceFile}`);
            continue;
          }

          // Copy source image
          const sourceSourcePath = path.join(sourcesDir, sourceFile);
          const sourceTargetPath = path.join(dataDir, sourceFile);

          // Skip if source image already exists
          if (existsSync(sourceTargetPath)) {
            console.warn(`Source image already exists: ${sourceTargetPath}`);
            continue;
          }

          await copyFile(sourceSourcePath, sourceTargetPath);

          // Copy target video with short random ID
          const targetSourcePath = path.join(targetsDir, targetFile);
          const targetPathInfo = getImagePathInfo("", targetFile);
          const targetName = `${targetPathInfo.name}-${nanoid(5)}${
            targetPathInfo.extension
          }`;
          const targetTargetPath = path.join(dataDir, targetName);
          await copyFile(targetSourcePath, targetTargetPath);

          const itemId = nanoid();
          const now = new Date().toISOString();
          taskItemsToCreate.push({
            id: itemId,
            taskId,
            data: {
              sourceImage: sourceFile,
              targetVideo: targetName,
              instruction,
            },
            locked: false,
            createdAt: now,
            updatedAt: now,
          });
        }
      })
      .with("image-editing", async () => {
        const targetsDir = path.join(tempExtractDir, "targets");

        if (!existsSync(targetsDir)) {
          throw new Error("Missing 'targets' folder in zip file");
        }

        const targetFiles = await readdir(targetsDir);
        for (const targetFile of targetFiles) {
          const targetPathInfo = getImagePathInfo("", targetFile);
          const instruction = instructionsMap.get(targetPathInfo.name) || "";

          // Find all source images
          const sourceImages: string[] = [];
          const extractDirContents = await readdir(tempExtractDir);
          const sourceFolders = extractDirContents
            .filter((f) => f.startsWith("sources_"))
            .sort();

          for (let i = 0; i < sourceFolders.length; i++) {
            const sourceFolder = sourceFolders[i];
            const sourceFolderPath = path.join(tempExtractDir, sourceFolder);
            const sourceFolderFiles = await readdir(sourceFolderPath);
            const matchingSource = sourceFolderFiles.find(
              (f) => getImagePathInfo("", f).name === targetPathInfo.name
            );

            if (matchingSource) {
              const sourceSourcePath = path.join(
                sourceFolderPath,
                matchingSource
              );

              // First source keeps original name, others get random ID
              const sourcePathInfo = getImagePathInfo("", matchingSource);
              const finalSourceName =
                i === 0
                  ? matchingSource
                  : `${sourcePathInfo.name}-${nanoid(5)}${
                      sourcePathInfo.extension
                    }`;

              const sourceTargetPath = path.join(dataDir, finalSourceName);

              // Skip if source already exists
              if (existsSync(sourceTargetPath)) {
                console.warn(
                  `Source image already exists: ${sourceTargetPath}`
                );
                continue;
              }

              await copyFile(sourceSourcePath, sourceTargetPath);
              sourceImages.push(finalSourceName);
            }
          }

          // Copy target to data directory with short random ID
          const targetSourcePath = path.join(targetsDir, targetFile);
          const targetName = `${targetPathInfo.name}-${nanoid(5)}${
            targetPathInfo.extension
          }`;
          const targetTargetPath = path.join(dataDir, targetName);
          await copyFile(targetSourcePath, targetTargetPath);

          const itemId = nanoid();
          const now = new Date().toISOString();
          taskItemsToCreate.push({
            id: itemId,
            taskId,
            data: {
              sourceImages: sourceImages.length > 0 ? sourceImages : [],
              targetImage: targetName,
              instruction,
            },
            locked: false,
            createdAt: now,
            updatedAt: now,
          });
        }
      })
      .exhaustive();

    // Insert task items
    if (taskItemsToCreate.length > 0) {
      await db.insert(taskItemsTable).values(taskItemsToCreate);
    }

    // Cleanup temp files
    await rm(tempZipPath, { force: true });
    await rm(tempExtractDir, { recursive: true, force: true });

    return NextResponse.json({});
  } catch (error) {
    console.error("Failed to process zip file:", error);

    // Cleanup on error
    try {
      await rm(tempZipPath, { force: true });
      await rm(tempExtractDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error("Failed to cleanup temp files:", cleanupError);
    }

    return NextResponse.json(
      {
        error: "Failed to process zip file",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
