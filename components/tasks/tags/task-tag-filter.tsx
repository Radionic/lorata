"use client";

import { useTaskTagList } from "@/lib/queries/use-tags";
import { TagFilter } from "@/components/tasks/tags/tag-filter";

interface TaskTagFilterProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TaskTagFilter({
  selectedTags,
  onTagsChange,
}: TaskTagFilterProps) {
  const { data: tags, isLoading } = useTaskTagList();

  return (
    <TagFilter
      title="Filter tasks by tags"
      tags={tags}
      isLoading={isLoading}
      selectedTags={selectedTags}
      onTagsChange={onTagsChange}
    />
  );
}
