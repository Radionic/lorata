import { spawn } from "child_process";
import { existsSync } from "fs";
import { mkdir, readdir, rename, rm, stat, unlink } from "fs/promises";
import path from "path";

async function executeFFmpeg(args: string[]) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args);
    let stderr = "";

    child.on("error", (err) => reject(err));
    child.stderr?.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("close", (code) => {
      if (code === 0) return resolve();
      reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
    });
  });
}

/**
 * Convert a video using ffmpeg.
 * Stores the converted file under: {original_dir}/{subdir}/{original_filename}
 */
export async function convertVideo({
  inputPath,
  fps,
  crf,
  preset,
}: {
  inputPath: string;
  fps?: number;
  crf?: number;
  preset?: string;
}): Promise<string> {
  if (fps !== undefined && (!isFinite(fps) || fps <= 0)) {
    throw new Error("Invalid fps value");
  }

  const ext = path.extname(inputPath).toLowerCase();
  const dir = path.dirname(inputPath);

  const outputDir = path.join(dir, `fps_${fps}`);
  await mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, path.basename(inputPath));

  // If already converted, reuse existing file.
  if (existsSync(outputPath)) {
    return outputPath;
  }

  const isWebm = ext === ".webm";

  const args: string[] = ["-y", "-i", inputPath, "-c:a", "copy"];

  if (fps && fps > 0) {
    args.push("-r", String(fps));
    if (isWebm) {
      args.push(
        "-c:v",
        "libvpx-vp9",
        "-b:v",
        "0",
        "-crf",
        crf ? String(crf) : "20",
        "-row-mt",
        "1"
      );
    } else {
      args.push(
        "-c:v",
        "libx264",
        "-preset",
        preset || "fast",
        "-crf",
        crf ? String(crf) : "20"
      );
    }
  } else {
    // No FPS change: stream copy video to avoid re-encode
    args.push("-c:v", "copy");
  }

  args.push(outputPath);

  await executeFFmpeg(args);

  return outputPath;
}

async function extractSegment({
  inputPath,
  outputPath,
  start,
  end,
}: {
  inputPath: string;
  outputPath: string;
  start: number;
  end: number;
}) {
  if (!isFinite(start) || start < 0) {
    throw new Error(`Invalid start time`);
  }
  if (!isFinite(end) || end <= 0) {
    throw new Error(`Invalid end time`);
  }
  if (end <= start) {
    throw new Error(`End time must be greater than start time`);
  }

  const dur = end - start;
  const args: string[] = [
    "-y",
    "-ss",
    start.toFixed(3),
    "-i",
    inputPath,
    "-t",
    dur.toFixed(3),
    "-c",
    "copy",
    outputPath,
  ];

  await executeFFmpeg(args);
}

/**
 * Extract segments from a video using ffmpeg without re-encoding.
 * - Uses stream copy for both video and audio (`-c copy`)
 * - Supports two modes:
 *   1. Replace mode (replace=true): Only works with a single segment. Replaces the original file.
 *   2. Create mode (replace=false): Creates new files in the same directory with unique names.
 * - Returns array of relative filenames for the output(s)
 */
export async function extractVideoSegments({
  inputPath,
  segments,
  replace = false,
}: {
  inputPath: string;
  segments: Array<{ start: number; end: number }>;
  replace?: boolean;
}): Promise<string[]> {
  if (!segments || segments.length === 0) {
    throw new Error("No segments provided");
  }

  if (replace && segments.length > 1) {
    throw new Error("Replace mode only works with a single segment");
  }

  const dir = path.dirname(inputPath);
  const { name, ext } = path.parse(inputPath);
  const outputPaths: string[] = [];

  if (replace) {
    // Replace mode: extract to temp location, then replace original
    const { start, end } = segments[0];
    const tempDir = path.join(dir, "passthrough");
    await mkdir(tempDir, { recursive: true });
    const tempPath = path.join(tempDir, path.basename(inputPath));

    await extractSegment({
      inputPath,
      outputPath: tempPath,
      start,
      end,
    });

    await unlink(inputPath);
    await rename(tempPath, inputPath);

    outputPaths.push(path.basename(inputPath));
  } else {
    // Create mode: create new files in the same directory
    for (let i = 0; i < segments.length; i++) {
      const { start, end } = segments[i];
      const timestamp = Date.now();
      const outputFilename = `${name}_segment_${timestamp}${ext}`;
      const outputPath = path.join(dir, outputFilename);

      await extractSegment({
        inputPath,
        outputPath,
        start,
        end,
      });

      outputPaths.push(outputFilename);
    }
  }

  return outputPaths;
}

/**
 * Delete videos and converted variants of a given filename, including
 * - fps_*
 *
 * Example layout:
 *   baseDir/
 *     my_video.mp4 <-- will be removed if it exists
 *     fps_24/my_video.mp4  <-- will be removed if it exists
 */
export async function deleteVideo(baseDir: string, filename: string) {
  const filepath = path.join(baseDir, filename);
  if (existsSync(filepath)) {
    await unlink(filepath);
  }

  const entries: string[] = await readdir(baseDir);
  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.startsWith("fps_")) return;

      const subdir = path.join(baseDir, entry);
      if (!(await stat(subdir)).isDirectory()) return;

      const derivedPath = path.join(subdir, filename);
      if (existsSync(derivedPath)) {
        await unlink(derivedPath);
      }
    })
  );
}

/**
 * Extract frames from a video using ffmpeg.
 * - Extracts one frame every `interval` seconds, up to `numFrames` frames.
 * - Saves to: {original_dir}/frames/{original_video_name}/frame_1.jpg
 */
export async function extractFrames(
  inputPath: string,
  numFrames: number,
  interval: number
): Promise<string[]> {
  if (!Number.isInteger(numFrames) || numFrames <= 0) {
    throw new Error("Invalid numFrames value");
  }
  if (!isFinite(interval) || interval <= 0) {
    throw new Error("Invalid interval value");
  }

  const dir = path.dirname(inputPath);
  const { name } = path.parse(inputPath); // original video name without extension
  const outputDir = path.join(dir, "frames", name);

  // Remove existing frames first
  if (existsSync(outputDir)) {
    await rm(outputDir, { recursive: true });
  }
  await mkdir(outputDir, { recursive: true });

  const outputPattern = path.join(outputDir, "frame_%d.jpg");

  const args: string[] = [
    "-y",
    "-i",
    inputPath,
    "-vf",
    `fps=1/${interval}`,
    "-vframes",
    String(numFrames),
    "-q:v",
    "2",
    "-start_number",
    "1",
    outputPattern,
  ];

  await executeFFmpeg(args);

  const result: string[] = [];
  for (let i = 1; i <= numFrames; i++) {
    const p = path.join(outputDir, `frame_${i}.jpg`);
    if (existsSync(p)) result.push(p);
  }
  return result;
}

/**
 * Extract the first frame from a video as a JPEG image.
 */
export async function extractFirstFrame(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const args: string[] = [
    "-y",
    "-i",
    inputPath,
    "-vf",
    "select=eq(n\\,0)",
    "-vframes",
    "1",
    "-q:v",
    "0",
    outputPath,
  ];

  await executeFFmpeg(args);
}
