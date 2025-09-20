import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const taskId = formData.get("taskId") as string;
  const overwriteImage = formData.get("overwriteImage") === "true";

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
  if (!overwriteImage && existsSync(filepath)) {
    return NextResponse.json(
      { error: "An image with the same name already exists" },
      { status: 409 }
    );
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

  const filepath = path.join(process.cwd(), "data", taskId, filename);
  if (existsSync(filepath)) {
    await unlink(filepath);
  }

  // if (!existsSync(filepath)) {
  //   return NextResponse.json({ error: "File not found" }, { status: 404 });
  // }
  // await unlink(filepath);

  return NextResponse.json({});
}
