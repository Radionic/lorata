"use client";

import { useTaskItemTags } from "@/lib/queries/use-tags";
import { TagFilter } from "@/components/tasks/tags/tag-filter";

interface TaskItemTagFilterProps {
  taskId: string;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TaskItemTagFilter({
  taskId,
  selectedTags,
  onTagsChange,
}: TaskItemTagFilterProps) {
  const { data: tags, isLoading } = useTaskItemTags(taskId);

  return (
    <TagFilter
      title="Filter items by tags"
      tags={tags}
      isLoading={isLoading}
      selectedTags={selectedTags}
      onTagsChange={onTagsChange}
    />
  );
}
