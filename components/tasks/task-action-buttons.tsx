"use client";
import { useState } from "react";
import { Download, Plus, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { useCreateTaskItem } from "@/lib/queries/use-task-item";
import { useExportTask } from "@/lib/queries/use-task";
import { toast } from "sonner";
import { Task } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { GenerateInstructionDialog } from "@/components/tasks/dialog/generate-instruction-dialog";

export function TaskActionButtons({
  taskId,
  task,
}: {
  taskId: string;
  task?: Task | null;
}) {
  const { mutateAsync: exportTask } = useExportTask();
  const { mutate: createTaskItem } = useCreateTaskItem();

  const isVideoTask =
    task?.type === "text-to-video" || task?.type === "image-to-video";

  const commonFps = [12, 16, 24, 30, 60];
  const [selectedFps, setSelectedFps] = useState<number | undefined>(undefined);
  const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState<boolean>(false);
  const [crf, setCrf] = useState<number>(20);
  const [preset, setPreset] = useState<string>("fast");
  const [prefix, setPrefix] = useState<string>("");
  const [suffix, setSuffix] = useState<string>("");

  const doExport = () =>
    toast.promise(
      exportTask({
        taskId,
        fps: selectedFps,
        crf,
        preset,
        prefix,
        suffix,
      }),
      {
        loading: "Exporting...",
        success: "Exported successfully",
        error: "Failed to export",
      }
    );

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={() => setGenerateDialogOpen(true)}
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        Generate Caption
      </Button>

      <Button
        variant="outline"
        onClick={() => setExportDialogOpen(true)}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Export
      </Button>

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Options</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Prefix</Label>
                <Input
                  placeholder="Optional prefix"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Suffix</Label>
                <Input
                  placeholder="Optional suffix"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                />
              </div>
            </div>

            {isVideoTask && (
              <>
                <Label>FPS</Label>
                <Select
                  value={selectedFps ? String(selectedFps) : "original"}
                  onValueChange={(val) => {
                    if (val === "original") setSelectedFps(undefined);
                    else setSelectedFps(parseFloat(val));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Original" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">Original</SelectItem>
                    {commonFps.map((fps) => (
                      <SelectItem key={fps} value={String(fps)}>
                        {fps} fps
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedFps && (
                  <>
                    <div className="space-y-2">
                      <Label>
                        CRF
                        <span className="text-xs text-muted-foreground">
                          (Lower CRF, higher quality, larger file sizes, range:
                          0-50)
                        </span>
                      </Label>

                      <Input
                        type="number"
                        className="w-20"
                        min={0}
                        max={50}
                        step={1}
                        value={crf}
                        onChange={(e) => setCrf(Number(e.target.value))}
                        onBlur={() => {
                          if (crf < 0) setCrf(0);
                          if (crf > 50) setCrf(50);
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Preset
                        <span className="text-xs text-muted-foreground">
                          (Faster conversion preset, larger file sizes)
                        </span>
                      </Label>
                      <Select value={preset} onValueChange={setPreset}>
                        <SelectTrigger>
                          <SelectValue placeholder="fast" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "ultrafast",
                            "superfast",
                            "veryfast",
                            "faster",
                            "fast",
                            "medium",
                            "slow",
                            "slower",
                            "veryslow",
                          ].map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExportDialogOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setExportDialogOpen(false);
                doExport();
              }}
              type="button"
            >
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button onClick={() => createTaskItem({ taskId })} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Item
      </Button>

      {generateDialogOpen && (
        <GenerateInstructionDialog
          taskId={taskId}
          hasVideo={isVideoTask}
          open={generateDialogOpen}
          onOpenChange={setGenerateDialogOpen}
        />
      )}
    </div>
  );
}
