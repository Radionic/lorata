import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { deleteVideo } from "@/lib/video";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const taskId = formData.get("taskId") as string;
  const overwrite = formData.get("overwrite") === "true";

  if (!file || !taskId) {
    return NextResponse.json(
      { error: "Missing required fields: file, or taskId" },
      { status: 400 }
    );
  }

  const dataDir = path.join(process.cwd(), "data", taskId);
  if (!existsSync(dataDir)) {
    await mkdir(dataDir, { recursive: true });
  }

  const filepath = path.join(dataDir, file.name);
  if (!overwrite && existsSync(filepath)) {
    return NextResponse.json(
      { error: "A media file with the same name already exists" },
      { status: 409 }
    );
  }

  if (overwrite) {
    await deleteVideo(dataDir, file.name);
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(filepath, buffer);

  return NextResponse.json({});
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("taskId");
  const filename = searchParams.get("filename");

  if (!taskId || !filename) {
    return NextResponse.json(
      { error: "Missing required parameters: taskId or filename" },
      { status: 400 }
    );
  }

  const dataDir = path.join(process.cwd(), "data", taskId);
  await deleteVideo(dataDir, filename);

  return NextResponse.json({});
}
