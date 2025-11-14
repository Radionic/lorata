"use client";

import { useEffect, useState, type KeyboardEventHandler } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useTaskItemTagsForItem,
  useUpdateTaskItemTags,
} from "@/lib/queries/use-tags";

interface TaskItemTagEditorProps {
  taskId: string;
  itemId: string;
  disabled?: boolean;
}

export function TaskItemTagEditor({
  taskId,
  itemId,
  disabled,
}: TaskItemTagEditorProps) {
  const { data: tags, isLoading } = useTaskItemTagsForItem(taskId, itemId);
  const { mutate: updateItemTags, isLoading: isSaving } =
    useUpdateTaskItemTags();

  const [localTags, setLocalTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (tags) {
      setLocalTags(tags.map((t) => t.name));
    }
  }, [tags]);

  const saveTags = (nextTags: string[]) => {
    setLocalTags(nextTags);
    updateItemTags({ taskId, itemId, tagNames: nextTags });
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
      className="space-y-2 text-xs"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm font-medium">Tags</Label>
        {isEditing ? (
          <Check
            className={cn(
              "w-4 h-4",
              disabled
                ? "opacity-50 pointer-events-none"
                : "cursor-pointer text-green-600"
            )}
            onClick={() => {
              if (disabled) return;
              setIsEditing(false);
            }}
          />
        ) : (
          <Pencil
            className={cn(
              "w-4 h-4",
              disabled ? "opacity-50 pointer-events-none" : "cursor-pointer"
            )}
            onClick={() => {
              if (disabled) return;
              setIsEditing(true);
            }}
          />
        )}
      </div>

      {isEditing && (
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a tag name and press Enter to create"
          className="max-w-xs"
          disabled={isSaving || disabled}
        />
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {localTags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="flex items-center gap-1 px-1.5 py-0 text-[11px]"
          >
            <span>{tag}</span>
            {isEditing && (
              <button
                type="button"
                className="flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleRemoveTag(tag);
                }}
                disabled={isSaving || disabled}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>
    </div>
  );
}
