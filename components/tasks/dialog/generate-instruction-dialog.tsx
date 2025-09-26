import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "usehooks-ts";
import { useAICaptioning } from "@/lib/queries/use-ai";
import { Label } from "@/components/ui/label";
import { VideoOptions } from "@/app/api/ai/route";
import { Input } from "@/components/ui/input";

export function GenerateInstructionDialog({
  taskId,
  itemId,
  hasVideo,
  open,
  onOpenChange,
}: {
  taskId: string;
  itemId: string;
  hasVideo?: boolean;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onInstructionGenerated?: (instruction: string) => void;
}) {
  const [prompt, setPrompt] = useLocalStorage<string>(
    "generate-instruction-prompt",
    "You are an image captioning expert, please write a caption for this image"
  );
  const [videoOptions, setVideoOptions] = useLocalStorage<VideoOptions>(
    "generate-instruction-video-options",
    {
      numFrames: 5,
      interval: 1,
    }
  );

  const { mutateAsync: generateInstruction, isLoading } = useAICaptioning();

  const onSubmit = async () => {
    await generateInstruction({
      taskId,
      prompt,
      itemId,
      videoOptions: hasVideo ? videoOptions : undefined,
    });

    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate instruction</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Prompt</Label>
          <Textarea
            placeholder="Prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full field-sizing-content resize-none min-h-0"
          />
        </div>

        {hasVideo && (
          <div className="space-y-2">
            <Label>Video Options</Label>
            <div className="text-sm">
              Extract{" "}
              <Input
                type="number"
                className="w-14 inline mb-1"
                value={videoOptions.numFrames}
                onChange={(e) =>
                  setVideoOptions({
                    ...videoOptions,
                    numFrames: parseInt(e.target.value),
                  })
                }
              />{" "}
              video frames for video captioning. Extract every{" "}
              <Input
                type="number"
                className="w-14 inline"
                value={videoOptions.interval}
                onChange={(e) =>
                  setVideoOptions({
                    ...videoOptions,
                    interval: parseInt(e.target.value),
                  })
                }
              />{" "}
              seconds.
            </div>
          </div>
        )}

        <DialogFooter>
          <DialogFooter>
            <Button type="submit" onClick={onSubmit} disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate"}
            </Button>
          </DialogFooter>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
