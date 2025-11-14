import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";

export interface TagWithCount {
  id: string;
  name: string;
  count: number;
}

export interface TaskTag {
  id: string;
  name: string;
}

export const useTaskItemTags = (taskId: string) => {
  return useQuery<TagWithCount[], Error>({
    queryKey: ["taskItemTags", taskId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/items/tags`);

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

export const useTaskTags = (taskId: string) => {
  return useQuery<TaskTag[], Error>({
    queryKey: ["taskTags", taskId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/tags`);

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch task tags");
        return [];
      }

      const data = await response.json();
      return data.tags;
    },
    enabled: !!taskId,
  });
};

export const useUpdateTaskTags = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      tagNames,
    }: {
      taskId: string;
      tagNames: string[];
    }) => {
      const response = await fetch(`/api/tasks/${taskId}/tags`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tags: tagNames }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to update task tags");
        return false;
      }

      return true;
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries(["taskTags", taskId]);
    },
  });
};

// Aggregated list of task-level tags across all tasks
export const useTaskTagList = () => {
  return useQuery<TagWithCount[], Error>({
    queryKey: ["taskTagList"],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/tags`);

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch task tags");
        return [];
      }

      const data = await response.json();
      return data.tags;
    },
  });
};

export const useTaskItemTagsForItem = (taskId: string, itemId: string) => {
  return useQuery<TaskTag[], Error>({
    queryKey: ["taskItemTags", taskId, itemId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/items/${itemId}/tags`);

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch item tags");
        return [];
      }

      const data = await response.json();
      return data.tags;
    },
    enabled: !!taskId && !!itemId,
  });
};

export const useUpdateTaskItemTags = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      itemId,
      tagNames,
    }: {
      taskId: string;
      itemId: string;
      tagNames: string[];
    }) => {
      const response = await fetch(
        `/api/tasks/${taskId}/items/${itemId}/tags`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tags: tagNames }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to update item tags");
        return false;
      }

      return true;
    },
    onSuccess: (_, { taskId, itemId }) => {
      queryClient.invalidateQueries(["taskItems", taskId]);
      queryClient.invalidateQueries(["taskItemTags", taskId, itemId]);
      queryClient.invalidateQueries(["taskItemTags", taskId]);
    },
  });
};
