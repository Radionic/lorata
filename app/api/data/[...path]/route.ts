import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const contentTypeMap: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const filePath = (await params).path.join("/");
  const dataDir = path.resolve(process.cwd(), "data");
  const fullPath = path.resolve(dataDir, filePath);

  // Ensure the path is within the data directory
  if (!fullPath.startsWith(dataDir + path.sep)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  if (!existsSync(fullPath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const fileBuffer = await readFile(fullPath);
  const ext = path.extname(fullPath).toLowerCase();
  const contentType = contentTypeMap[ext] || "application/octet-stream";

  // Return the file with appropriate headers
  // Use no-cache for images to ensure edited versions are always fresh
  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
