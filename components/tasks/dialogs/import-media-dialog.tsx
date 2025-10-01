"use client";

import { useRef, useState } from "react";
import { Loader2, FileArchive } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useBulkUploadMedia } from "@/lib/queries/use-media";
import { cn } from "@/lib/utils";

interface ImportMediaDialogProps {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportMediaDialog({
  taskId,
  open,
  onOpenChange,
}: ImportMediaDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { mutateAsync: bulkUploadMedia, isLoading } = useBulkUploadMedia();

  const handleUpload = async (file: File) => {
    if (!file.name.endsWith(".zip")) {
      toast.error("Please select a zip file");
      return;
    }

    setSelectedFile(file);

    const success = await bulkUploadMedia({
      files: [file],
      taskId,
    });

    if (success) {
      toast.success("Successfully imported task items!");
      onOpenChange(false);
    }
    setSelectedFile(null);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    await handleUpload(file);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleUpload(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Import from Zip File</DialogTitle>
        </DialogHeader>

        {/* Upload Area */}
        <div
          className={cn(
            "border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center transition-colors",
            isLoading
              ? "opacity-50 pointer-events-none"
              : "hover:border-muted-foreground/50 cursor-pointer"
          )}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !isLoading && fileInputRef.current?.click()}
        >
          {isLoading ? (
            <>
              <Loader2 className="mx-auto h-8 w-8 text-muted-foreground mb-3 animate-spin" />
              <p className="text-sm text-muted-foreground mb-1">
                Processing zip file...
              </p>
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  {selectedFile.name}
                </p>
              )}
            </>
          ) : (
            <>
              <FileArchive className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-1">
                Click to select or drag and drop a zip file
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            disabled={isLoading}
            onChange={handleFileSelect}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
