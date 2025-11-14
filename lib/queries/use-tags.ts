import { useQuery } from "react-query";
import { toast } from "sonner";

export interface TagWithCount {
  id: string;
  name: string;
  count: number;
}

export const useTaskTags = (taskId: string) => {
  return useQuery<TagWithCount[], Error>({
    queryKey: ["taskTags", taskId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/tags`);

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch tags");
        return [];
      }

      const data = await response.json();
      return data.tags;
    },
    enabled: !!taskId,
  });
};
