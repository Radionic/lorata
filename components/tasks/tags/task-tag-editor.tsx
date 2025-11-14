"use client";

import { useEffect, useState, type KeyboardEventHandler } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useTaskTags, useUpdateTaskTags } from "@/lib/queries/use-tags";

interface TaskTagEditorProps {
  taskId: string;
}

export function TaskTagEditor({ taskId }: TaskTagEditorProps) {
  const { data: tags, isLoading } = useTaskTags(taskId);
  const { mutate: updateTaskTags, isLoading: isSaving } = useUpdateTaskTags();

  const [localTags, setLocalTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (tags) {
      setLocalTags(tags.map((t) => t.name));
    }
  }, [tags]);

  const saveTags = (nextTags: string[]) => {
    setLocalTags(nextTags);
    updateTaskTags({ taskId, tagNames: nextTags });
  };

  const handleAddTag = () => {
    const value = inputValue.trim();
    if (!value) return;
    if (localTags.includes(value)) {
      setInputValue("");
      return;
    }
    const next = [...localTags, value];
    setInputValue("");
    saveTags(next);
  };

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === "Backspace" && !inputValue && localTags.length > 0) {
      const next = localTags.slice(0, -1);
      saveTags(next);
    }
  };

  const handleRemoveTag = (name: string) => {
    const next = localTags.filter((t) => t !== name);
    saveTags(next);
  };

  if (isLoading && !tags) {
    return null;
  }

  return (
    <div
      className="space-y-2 text-xs text-muted-foreground"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a tag name and press Enter to create"
        className="max-w-xs"
        disabled={isSaving}
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {localTags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="flex items-center gap-1 px-1.5 py-0 text-[11px]"
          >
            <span>{tag}</span>
            <button
              type="button"
              className="flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleRemoveTag(tag);
              }}
              disabled={isSaving}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
