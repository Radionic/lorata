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
import { useCompletion } from "@ai-sdk/react";
import { toast } from "sonner";

export function GenerateInstructionDialog({
  images,
  open,
  onOpenChange,
  onInstructionGenerated,
}: {
  images?: string[];
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onInstructionGenerated?: (instruction: string) => void;
}) {
  const [prompt, setPrompt] = useLocalStorage<string>(
    "generate-instruction-prompt",
    "You are an image captioning expert, please write a caption for this image"
  );

  const { complete, isLoading } = useCompletion({
    api: "/api/ai",
  });

  const onSubmit = async () => {
    const result = await complete(prompt, {
      body: {
        images,
      },
    });

    if (result) {
      onInstructionGenerated?.(result);
      onOpenChange?.(false);
    } else {
      toast.error("Failed to generate instruction");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate instruction</DialogTitle>
        </DialogHeader>

        <Textarea
          placeholder="Prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full field-sizing-content resize-none min-h-0"
        />

        {images && images.length > 0 ? (
          <>
            <p>The following {images?.length} images will be used:</p>
            <div className="flex flex-wrap gap-2">
              {images?.map((image) => (
                <img key={image} src={image} className="w-16 object-cover" />
              ))}
            </div>
          </>
        ) : (
          <p className="text-red-500">Warning: no images uploaded</p>
        )}
        <DialogFooter>
          <DialogFooter>
            <Button
              type="submit"
              onClick={onSubmit}
              disabled={isLoading || !images?.length}
            >
              {isLoading ? "Generating..." : "Generate"}
            </Button>
          </DialogFooter>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
