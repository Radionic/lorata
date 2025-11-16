import { useQuery, useMutation, useQueryClient } from "react-query";
import { TaskItem } from "@/lib/types";
import { toast } from "sonner";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TaskItemsResponse<T extends TaskItem> {
  items: T[];
  pagination: PaginationMeta;
}

export const useTaskItems = <T extends TaskItem>(
  taskId: string,
  filterTags?: string[],
  page: number = 1,
  limit: number = 20
) => {
  return useQuery<TaskItemsResponse<T>, Error>({
    queryKey: ["taskItems", taskId, filterTags, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterTags && filterTags.length > 0) {
        params.set("tags", filterTags.join(","));
      }
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      const url = `/api/tasks/${taskId}/items?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch task items");
        return {
          items: [],
          pagination: { total: 0, totalPages: 0 },
        };
      }

      const data = await response.json();
      return data;
    },
    enabled: !!taskId,
    keepPreviousData: true,
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
