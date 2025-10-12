import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { existsSync } from "fs";
import { extractVideoSegments } from "@/lib/video";

export async function POST(request: NextRequest) {
  const { taskId, filename, segments, replace } = await request.json();

  if (!taskId || !filename) {
    return NextResponse.json(
      { error: "Missing required fields: taskId, filename" },
      { status: 400 }
    );
  }

  if (!segments || !Array.isArray(segments) || segments.length === 0) {
    return NextResponse.json(
      { error: "segments array is required" },
      { status: 400 }
    );
  }

  // Validate all segments
  for (let i = 0; i < segments.length; i++) {
    const { start, end } = segments[i];
    if (
      start == null ||
      end == null ||
      !isFinite(start) ||
      !isFinite(end) ||
      start < 0 ||
      end <= start
    ) {
      return NextResponse.json(
        { error: `Invalid start/end values for segment ${i + 1}` },
        { status: 400 }
      );
    }
  }

  const baseDir = path.resolve(process.cwd(), "data", taskId);
  const inputPath = path.resolve(baseDir, filename);

  if (!inputPath.startsWith(baseDir + path.sep)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  if (!existsSync(inputPath)) {
    return NextResponse.json(
      { error: "Input video not found" },
      { status: 404 }
    );
  }

  const outputPaths = await extractVideoSegments({
    inputPath,
    segments,
    replace: !!replace,
  });

  return NextResponse.json({ outputPaths });
}
