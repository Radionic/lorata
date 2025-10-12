import { useQuery, useMutation, useQueryClient } from "react-query";
import { Task } from "@/lib/types";
import { toast } from "sonner";

export const useTasks = () => {
  return useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const url = "/api/tasks";
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch tasks");
        return [];
      }

      return (await response.json()).tasks;
    },
  });
};

export const useTask = (taskId: string) => {
  return useQuery<Task>({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}`);

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch task data");
        return null;
      }

      return (await response.json()).task;
    },
    enabled: !!taskId,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, type }: { name: string; type: string }) => {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, type }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to create task");
        return false;
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks"]);
    },
  });
};

export const useUpdateTaskSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      name,
      prefix,
      suffix,
    }: {
      taskId: string;
      name?: string | null;
      prefix?: string | null;
      suffix?: string | null;
    }) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, prefix, suffix }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to update task settings");
        return false;
      }

      return true;
    },
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries(["tasks"]);
      queryClient.invalidateQueries(["task", taskId]);
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId }: { taskId: string }) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to delete task");
        return false;
      }

      toast.success("Task deleted successfully");
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks"]);
    },
  });
};

export const useExportTask = () => {
  return useMutation({
    mutationFn: async ({
      taskId,
      fps,
      crf,
      preset,
      useFirstFrame, // For image-to-video tasks only
    }: {
      taskId: string;
      fps?: number;
      crf?: number;
      preset?: string;
      useFirstFrame?: boolean;
    }) => {
      const response = await fetch(`/api/tasks/${taskId}/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fps, crf, preset, useFirstFrame }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to export task");
        return false;
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename =
        contentDisposition?.match(/filename="([^"]+)"/)?.[1] ||
        `task_export_${Date.now()}.zip`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    },
  });
};
