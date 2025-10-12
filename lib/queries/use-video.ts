import { useMutation } from "react-query";
import { toast } from "sonner";

export const useTrimVideo = () => {
  return useMutation({
    mutationFn: async ({
      taskId,
      filename,
      segments,
      replace = false,
    }: {
      taskId: string;
      filename: string;
      segments: Array<{ start: number; end: number }>;
      replace?: boolean;
    }) => {
      const response = await fetch("/api/media/video/trim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskId, filename, segments, replace }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        toast.error(error.error || "Failed to trim video");
        return null;
      }

      const data = await response.json();
      return data.outputPaths as string[];
    },
  });
};
