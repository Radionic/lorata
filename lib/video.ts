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
  audio,
  crf,
  preset,
}: {
  inputPath: string;
  fps?: number;
  audio?: boolean;
  crf?: number;
  preset?: string;
}): Promise<string> {
  if (fps !== undefined && (!isFinite(fps) || fps <= 0)) {
    throw new Error("Invalid fps value");
  }

  const ext = path.extname(inputPath).toLowerCase();
  const dir = path.dirname(inputPath);

  const subDirParts: string[] = [];
  if (fps && fps > 0) subDirParts.push(`fps_${fps}`);
  if (audio === false) subDirParts.push("audio_off");
  const subdir = subDirParts.join("__");

  const outputDir = path.join(dir, subdir);
  await mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, path.basename(inputPath));

  // If already converted, reuse existing file.
  if (existsSync(outputPath)) {
    return outputPath;
  }

  const isWebm = ext === ".webm";

  const args: string[] = ["-y", "-i", inputPath];

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

  if (audio === false) {
    args.push("-an");
  } else {
    args.push("-c:a", "copy");
  }

  args.push(outputPath);

  await executeFFmpeg(args);

  return outputPath;
}

/**
 * Extract a segment from a video using ffmpeg without re-encoding.
 * - Uses stream copy for both video and audio (`-c copy`).
 * - The file will be overwritten if it already exists.
 */
export async function extractVideoSegment({
  inputPath,
  start,
  end,
}: {
  inputPath: string;
  start: number; // seconds
  end: number; // seconds
}) {
  if (!isFinite(start) || start < 0) {
    throw new Error("Invalid start time");
  }
  if (!isFinite(end) || end <= 0) {
    throw new Error("Invalid end time");
  }
  if (end <= start) {
    throw new Error("End time must be greater than start time");
  }

  const dir = path.dirname(inputPath);
  const outputDir = path.join(dir, "passthrough");
  await mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, path.basename(inputPath));

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

  await unlink(inputPath);
  await rename(outputPath, inputPath);
}

/**
 * Delete videos and converted variants of a given filename, including
 * - fps_*
 * - fps_*__audio_off
 * - audio_off
 *
 * Example layout:
 *   baseDir/
 *     my_video.mp4 <-- will be removed if it exists
 *     fps_24/my_video.mp4  <-- will be removed if it exists
 *     fps_24__audio_off/my_video.mp4  <-- will be removed if it exists
 */
export async function deleteVideo(baseDir: string, filename: string) {
  const filepath = path.join(baseDir, filename);
  if (existsSync(filepath)) {
    await unlink(filepath);
  }

  const entries: string[] = await readdir(baseDir);
  await Promise.all(
    entries.map(async (entry) => {
      if (!(entry.startsWith("fps_") || entry === "audio_off")) return;

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
