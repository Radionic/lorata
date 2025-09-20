import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useDeleteTask } from "@/lib/queries/use-task";
import { Button } from "../../ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { Task } from "@/lib/types";

export function DeleteTaskDialog({
  open,
  onOpenChange,
  task,
}: {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  task: Task;
}) {
  const { mutateAsync: deleteTask, isLoading } = useDeleteTask();

  const handleDeleteTask = async () => {
    await deleteTask({ taskId: task.id });
    onOpenChange?.(false);
  };

  const handleCancel = () => {
    onOpenChange?.(false);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[425px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <DialogTitle>Delete Task</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            Are you sure you want to delete "{task.name}"? This action cannot be
            undone.
            <br />
            <br />
            This will permanently delete:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>The task and all its items ({task.itemCount} items)</li>
              <li>All associated data files</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteTask}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Task"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
