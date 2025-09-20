import { useMutation } from "react-query";
import { toast } from "sonner";

export const useUploadImage = () => {
  return useMutation({
    mutationFn: async ({
      file,
      taskId,
      overwriteImage,
    }: {
      file: File;
      taskId: string;
      overwriteImage?: boolean;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("taskId", taskId);
      formData.append("overwriteImage", overwriteImage ? "true" : "false");

      const response = await fetch("/api/images", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to upload image");
        return false;
      }
      return true;
    },
  });
};

export const useDeleteImage = () => {
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
      const response = await fetch(`/api/images?${params}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to delete image");
        return false;
      }
      return true;
    },
  });
};
