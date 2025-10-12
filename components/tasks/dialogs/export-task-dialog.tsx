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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState } from "react";
import { useExportTask, useUpdateTaskSettings } from "@/lib/queries/use-task";
import { Task } from "@/lib/types";
import { useLocalStorage } from "usehooks-ts";

export function ExportTaskDialog({
  task,
  isVideoTask,
  open,
  onOpenChange,
}: {
  task: Task;
  isVideoTask?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const commonFps = [12, 16, 24, 30, 60];
  const [selectedFps, setSelectedFps] = useState<number>();

  const [crf, setCrf] = useState<number>(20);
  const [preset, setPreset] = useState<string>("fast");

  const [prefix, setPrefix] = useState<string>(task.prefix || "");
  const [suffix, setSuffix] = useState<string>(task.suffix || "");

  const [useFirstFrame, setUseFirstFrame] = useLocalStorage<boolean>(
    "useFirstFrame",
    true
  );

  const { mutateAsync: exportTask } = useExportTask();
  const { mutate: updateTaskSettings } = useUpdateTaskSettings();

  const handleAffixChanged = (affix: "prefix" | "suffix") => {
    if (affix === "prefix" && prefix !== task.prefix) {
      updateTaskSettings({ taskId: task.id, prefix });
    } else if (affix === "suffix" && suffix !== task.suffix) {
      updateTaskSettings({ taskId: task.id, suffix });
    }
  };

  const doExport = () =>
    toast.promise(
      exportTask({
        taskId: task.id,
        fps: selectedFps,
        crf,
        preset,
        useFirstFrame,
      }),
      {
        loading: "Exporting...",
        success: "Exported successfully",
        error: "Failed to export",
      }
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Export Options</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label>Prefix</Label>
            <Input
              placeholder="Optional prefix"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              onBlur={() => handleAffixChanged("prefix")}
            />
          </div>

          <div className="space-y-1">
            <Label>Suffix</Label>
            <Input
              placeholder="Optional suffix"
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
              onBlur={() => handleAffixChanged("suffix")}
            />
          </div>
        </div>

        {isVideoTask && (
          <div className="flex flex-col gap-3">
            <div className="space-y-1">
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
            </div>

            {selectedFps && (
              <>
                <div className="space-y-1">
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

                <div className="space-y-1">
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
          </div>
        )}

        {task.type === "image-to-video" && (
          <div className="flex items-center gap-2">
            <Switch
              id="use-first-frame"
              checked={useFirstFrame}
              onCheckedChange={setUseFirstFrame}
            />
            <Label htmlFor="use-first-frame" className="flex-1">
              Use first frame as source image
            </Label>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              doExport();
            }}
            type="button"
          >
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
