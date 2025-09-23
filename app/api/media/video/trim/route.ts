import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { existsSync } from "fs";
import { extractVideoSegment } from "@/lib/video";

export async function POST(request: NextRequest) {
  const { taskId, filename, start, end } = await request.json();

  if (!taskId || !filename || start == null || end == null) {
    return NextResponse.json(
      { error: "Missing required fields: taskId, filename, start, end" },
      { status: 400 }
    );
  }

  const s = Number(start);
  const e = Number(end);
  if (!isFinite(s) || !isFinite(e) || s < 0 || e <= s) {
    return NextResponse.json(
      { error: "Invalid start/end values" },
      { status: 400 }
    );
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

  await extractVideoSegment({
    inputPath,
    start: s,
    end: e,
  });

  return NextResponse.json({});
}
