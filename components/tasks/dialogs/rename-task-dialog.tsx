import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateTaskSettings } from "@/lib/queries/use-task";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Task } from "@/lib/types";

export function RenameTaskDialog({
  open,
  onOpenChange,
  task,
}: {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  task: Task;
}) {
  const { mutateAsync: renameTask, isLoading } = useUpdateTaskSettings();
  const [taskName, setTaskName] = useState(task.name);
  const isValidName = taskName.trim() && task && taskName.trim() !== task.name;

  const handleRenameTask = async () => {
    if (isValidName) {
      await renameTask({ taskId: task.id, name: taskName.trim() });
      onOpenChange?.(false);
    }
  };

  const handleCancel = () => {
    onOpenChange?.(false);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Task</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="task-name">Task Name</Label>
            <Input
              id="task-name"
              placeholder="Enter new task name..."
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRenameTask();
                }
                if (e.key === "Escape") {
                  handleCancel();
                }
              }}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleRenameTask}
            disabled={!isValidName || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Renaming...
              </>
            ) : (
              "Rename"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
