import { VideoOptions } from "@/app/api/ai/route";
import { useMutation } from "react-query";
import { toast } from "sonner";
import { useQueryClient } from "react-query";

export const useAICaptioning = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      prompt,
      itemId,
      videoOptions,
    }: {
      taskId: string;
      prompt: string;
      itemId: string;
      videoOptions?: VideoOptions;
    }) => {
      const response = await fetch("/api/ai", {
        method: "POST",
        body: JSON.stringify({
          prompt,
          itemId,
          videoOptions,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate caption");
      }
      return (await response.json()).text as string;
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
