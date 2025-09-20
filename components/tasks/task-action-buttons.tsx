import { Download, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { useCreateTaskItem } from "@/lib/queries/use-task-item";
import { useExportTask } from "@/lib/queries/use-task";
import { toast } from "sonner";

export function TaskActionButtons({ taskId }: { taskId: string }) {
  const { mutateAsync: exportTask } = useExportTask();
  const { mutate: createTaskItem } = useCreateTaskItem();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={() =>
          toast.promise(exportTask({ taskId }), {
            loading: "Exporting...",
            success: "Exported successfully",
            error: "Failed to export",
          })
        }
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Export
      </Button>
      <Button onClick={() => createTaskItem({ taskId })} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Item
      </Button>
    </div>
  );
}
