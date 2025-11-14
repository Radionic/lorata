import { VideoOptions, MediaSelection } from "@/app/api/ai/route";
import { useMutation } from "react-query";
import { toast } from "sonner";
import { useQueryClient } from "react-query";

export const useAICaptioning = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      prompt,
      itemId,
      overwrite,
      videoOptions,
      mediaSelection,
    }: {
      taskId: string;
      prompt: string;
      itemId?: string;
      overwrite?: boolean;
      videoOptions?: VideoOptions;
      mediaSelection?: MediaSelection;
    }) => {
      const response = await fetch("/api/ai", {
        method: "POST",
        body: JSON.stringify({
          taskId,
          prompt,
          itemId,
          overwrite,
          videoOptions,
          mediaSelection,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate caption");
      }
    },
    onSettled: (_, __, { taskId }) => {
      toast.success("Generated caption");
      queryClient.invalidateQueries(["taskItems", taskId]);
    },
    onError: () => {
      toast.error("Failed to generate caption");
    },
  });
};

export const useAutoTagging = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      prompt,
      overwrite,
      mediaSelection,
    }: {
      taskId: string;
      prompt: string;
      overwrite?: boolean;
      mediaSelection?: MediaSelection;
    }) => {
      const response = await fetch("/api/ai", {
        method: "POST",
        body: JSON.stringify({
          taskId,
          prompt,
          overwrite,
          mediaSelection,
          operation: "tag",
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to auto-tag images");
      }
    },
    onSettled: (_, __, { taskId }) => {
      toast.success("Auto-tagging completed");
      queryClient.invalidateQueries(["taskItems", taskId]);
    },
    onError: () => {
      toast.error("Failed to auto-tag images");
    },
  });
};
