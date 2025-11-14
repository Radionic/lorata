"use client";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tag } from "lucide-react";

interface ItemTag {
  id: string;
  name: string;
}

interface ItemTagsDisplayProps {
  tags?: ItemTag[];
}

export function ItemTagsDisplay({ tags }: ItemTagsDisplayProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
        <Tag className="h-3.5 w-3.5" />
        <Label className="text-xs">Tags:</Label>
      </div>
      {tags.map((tag) => (
        <Badge key={tag.id} variant="secondary" className="text-xs">
          {tag.name}
        </Badge>
      ))}
    </div>
  );
}
