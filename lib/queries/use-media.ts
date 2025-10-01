import { useMutation, useQueryClient } from "react-query";
import { toast } from "sonner";

export const useUploadMedia = () => {
  return useMutation({
    mutationFn: async ({
      file,
      taskId,
      overwrite,
    }: {
      file: File;
      taskId: string;
      overwrite?: boolean;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("taskId", taskId);
      formData.append("overwrite", overwrite ? "true" : "false");

      const response = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        toast.error(error.error || "Failed to upload media");
        return false;
      }
      return true;
    },
  });
};

export const useBulkUploadMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      files,
      taskId,
    }: {
      files: File[];
      taskId: string;
    }) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("taskId", taskId);

      const response = await fetch("/api/media/bulk", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        toast.error(error.error || "Failed to upload media");
        return false;
      }
      return true;
    },
    onSettled: (_, __, { taskId }) => {
      queryClient.invalidateQueries(["taskItems", taskId]);
    },
  });
};

export const useDeleteMedia = () => {
  return useMutation({
    mutationFn: async ({
      taskId,
      filename,
    }: {
      taskId: string;
      filename: string;
    }) => {
      const params = new URLSearchParams({
        taskId,
        filename,
      });
      const response = await fetch(`/api/media?${params}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        toast.error(error.error || "Failed to delete media");
        return false;
      }
      return true;
    },
  });
};
