export const getMediaUrl = ({
  taskId,
  filename,
}: {
  taskId?: string;
  filename?: string;
}) => {
  if (!taskId || !filename) return undefined;
  return `${window.location.origin}/api/data/${taskId}/${filename}`;
};
