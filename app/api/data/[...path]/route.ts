import { NextRequest, NextResponse } from "next/server";
import { readFile, open } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const contentTypeMap: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
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

  const ext = path.extname(fullPath).toLowerCase();
  const contentType = contentTypeMap[ext] || "application/octet-stream";
  const range = request.headers.get("range");

  // Support HTTP Range requests for video streaming
  if (range) {
    const bytesPrefix = "bytes=";
    if (!range.startsWith(bytesPrefix)) {
      return new NextResponse(null, { status: 416 });
    }
    const [startStr, endStr] = range.substring(bytesPrefix.length).split("-");
    const fileHandle = await open(fullPath, "r");
    try {
      const stat = await fileHandle.stat();
      const fileSize = stat.size;
      let start = parseInt(startStr, 10);
      let end = endStr ? parseInt(endStr, 10) : fileSize - 1;
      if (Number.isNaN(start) || start < 0) start = 0;
      if (Number.isNaN(end) || end >= fileSize) end = fileSize - 1;
      if (start > end) {
        await fileHandle.close();
        return new NextResponse(null, { status: 416 });
      }

      const chunkSize = end - start + 1;
      const buffer = Buffer.alloc(chunkSize);
      await fileHandle.read(buffer, 0, chunkSize, start);
      await fileHandle.close();

      return new NextResponse(buffer, {
        status: 206,
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(chunkSize),
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    } catch (err) {
      await fileHandle.close();
      throw err;
    }
  }

  const fileBuffer = await readFile(fullPath);

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
