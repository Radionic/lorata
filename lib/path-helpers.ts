import path from "path";

interface ImagePathInfo {
  absolutePath: string;
  extension: string;
  name: string;
}

export function getImagePathInfo(taskId: string, imagePath: string): ImagePathInfo {
  const absolutePath = path.resolve("data", taskId, imagePath);
  const extension = path.extname(imagePath);
  const name = path.basename(imagePath, extension);

  return {
    absolutePath,
    extension,
    name,
  };
}
