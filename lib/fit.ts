export interface FitOptions {
  margin?: number;
}

/**
 * Compute a scale factor that fits a content rectangle inside a container rectangle
 * while preserving aspect ratio. A symmetric margin is subtracted from container size
 * to ensure a small buffer and avoid overflow.
 */
export function computeFitScale(
  containerWidth: number,
  containerHeight: number,
  contentWidth: number,
  contentHeight: number,
  options: FitOptions = {}
): number {
  const { margin = 16 } = options;
  if (!containerWidth || !containerHeight || !contentWidth || !contentHeight) {
    return 1;
  }
  const availW = Math.max(0, containerWidth - margin * 2);
  const availH = Math.max(0, containerHeight - margin * 2);
  if (!availW || !availH) return 1;
  return Math.min(availW / contentWidth, availH / contentHeight);
}
