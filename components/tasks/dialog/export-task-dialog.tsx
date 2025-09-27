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
import { toast } from "sonner";
import { useState } from "react";
import { useExportTask } from "@/lib/queries/use-task";

export function ExportTaskDialog({
  taskId,
  isVideoTask,
  open,
  onOpenChange,
}: {
  taskId: string;
  isVideoTask?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const commonFps = [12, 16, 24, 30, 60];
  const [selectedFps, setSelectedFps] = useState<number>();

  const [crf, setCrf] = useState<number>(20);
  const [preset, setPreset] = useState<string>("fast");
  const [prefix, setPrefix] = useState<string>("");
  const [suffix, setSuffix] = useState<string>("");

  const { mutateAsync: exportTask } = useExportTask();

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
    <Dialog open={open} onOpenChange={onOpenChange}>
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
