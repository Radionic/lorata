import { useQuery, useMutation, useQueryClient } from "react-query";
import { TaskItem } from "@/lib/types";
import { toast } from "sonner";

export const useTaskItems = <T extends TaskItem>(taskId: string) => {
  return useQuery<T[], Error>({
    queryKey: ["taskItems", taskId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/items`);

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch task items");
        return [];
      }

      const data = await response.json();
      return data.items;
    },
    enabled: !!taskId,
  });
};

export const useUpdateTaskItem = <T extends TaskItem>() => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      item,
    }: {
      taskId: string;
      item: Omit<T, "createdAt" | "updatedAt">;
    }) => {
      const response = await fetch(`/api/tasks/${taskId}/items/${item.id}`, {
        method: "PUT",
        body: JSON.stringify(item.data),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to save task item");
        return false;
      }
      return true;
    },
    onSettled: (_, __, { taskId }) => {
      queryClient.invalidateQueries(["taskItems", taskId]);
    },
  });
};

export const useCreateTaskItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      itemsData,
    }: {
      taskId: string;
      itemsData?: Partial<TaskItem["data"]>[];
    }) => {
      const response = await fetch(`/api/tasks/${taskId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: itemsData ? JSON.stringify({ itemsData }) : undefined,
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to create task items");
        return false;
      }
      return true;
    },
    onSettled: (_, __, { taskId }) => {
      queryClient.invalidateQueries(["taskItems", taskId]);
    },
  });
};

export const useDeleteTaskItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      itemId,
    }: {
      taskId: string;
      itemId: string;
    }) => {
      const response = await fetch(`/api/tasks/${taskId}/items/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to delete task item");
        return false;
      }
      return true;
    },
    onSettled: (_, __, { taskId }) => {
      queryClient.invalidateQueries(["taskItems", taskId]);
    },
  });
};

export const useSetItemLocked = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      itemId,
      locked,
    }: {
      taskId: string;
      itemId: string;
      locked: boolean;
    }) => {
      const response = await fetch(
        `/api/tasks/${taskId}/items/${itemId}/lock`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ locked }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to update lock status");
        return false;
      }
      return true;
    },
    onSettled: (_, __, { taskId }) => {
      queryClient.invalidateQueries(["taskItems", taskId]);
    },
  });
};
