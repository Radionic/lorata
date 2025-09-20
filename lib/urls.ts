export const getImageUrl = ({
  taskId,
  filename,
}: {
  taskId?: string;
  filename?: string;
}) => {
  if (!taskId || !filename) return undefined;
  return `/api/data/${taskId}/${filename}`;
};
