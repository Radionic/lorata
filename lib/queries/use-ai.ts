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
      overwriteInstruction,
      videoOptions,
      mediaSelection,
    }: {
      taskId: string;
      prompt: string;
      itemId?: string;
      overwriteInstruction?: boolean;
      videoOptions?: VideoOptions;
      mediaSelection?: MediaSelection;
    }) => {
      const response = await fetch("/api/ai", {
        method: "POST",
        body: JSON.stringify({
          taskId,
          prompt,
          itemId,
          overwriteInstruction,
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
