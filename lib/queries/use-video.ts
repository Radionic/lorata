import { useMutation } from "react-query";
import { toast } from "sonner";

export const useTrimVideo = () => {
  return useMutation({
    mutationFn: async ({
      taskId,
      filename,
      start,
      end,
    }: {
      taskId: string;
      filename: string;
      start: number;
      end: number;
    }) => {
      const response = await fetch("/api/media/video/trim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskId, filename, start, end }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        toast.error(error.error || "Failed to trim video");
        return false;
      }
      return true;
    },
  });
};
