"use client";

import { Badge } from "@/components/ui/badge";
import { useTaskTags } from "@/lib/queries/use-tags";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaskTagFilterProps {
  taskId: string;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TaskTagFilter({
  taskId,
  selectedTags,
  onTagsChange,
}: TaskTagFilterProps) {
  const { data: tags, isLoading } = useTaskTags(taskId);

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onTagsChange(selectedTags.filter((t) => t !== tagName));
    } else {
      onTagsChange([...selectedTags, tagName]);
    }
  };

  const clearAllTags = () => {
    onTagsChange([]);
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Loading tags...
      </div>
    );
  }

  if (!tags || tags.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No tags found
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Filter by tags</p>
        {selectedTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllTags}
            className="h-auto py-1 px-2 text-xs shrink-0"
          >
            Clear all
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag.name);
          return (
            <Badge
              key={tag.id}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "cursor-pointer whitespace-nowrap shrink-0",
                isSelected && "pr-1"
              )}
              onClick={() => toggleTag(tag.name)}
            >
              <span>{tag.name}</span>
              <span className="ml-1.5 text-xs opacity-70">({tag.count})</span>
              {isSelected && (
                <X className="ml-1 h-3 w-3 hover:bg-primary-foreground/20 rounded-sm" />
              )}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
