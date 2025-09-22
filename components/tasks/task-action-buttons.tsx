"use client";
import { useState } from "react";
import { Download, Plus } from "lucide-react";
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
import { Switch } from "../ui/switch";

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
  const [includeAudio, setIncludeAudio] = useState<boolean>(true);
  const [crf, setCrf] = useState<number>(20);
  const [preset, setPreset] = useState<string>("fast");

  const doExport = () =>
    toast.promise(
      exportTask({
        taskId,
        fps: selectedFps,
        audio: includeAudio,
        crf,
        preset,
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
        onClick={() => (isVideoTask ? setExportDialogOpen(true) : doExport())}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Export
      </Button>

      {isVideoTask && (
        <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Options</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={includeAudio}
                  onCheckedChange={setIncludeAudio}
                />
                <Label>Export audio</Label>
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="crf">
                  CRF
                  <span className="text-xs text-muted-foreground">
                    (Lower CRF, higher quality, larger file sizes, range: 0-50)
                  </span>
                </Label>

                <Input
                  id="crf"
                  type="number"
                  className="w-20"
                  min={0}
                  max={50}
                  step={1}
                  disabled={selectedFps === undefined}
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
                <Select
                  value={preset}
                  onValueChange={setPreset}
                  disabled={selectedFps === undefined}
                >
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
      )}

      <Button onClick={() => createTaskItem({ taskId })} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Item
      </Button>
    </div>
  );
}
