import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectTrigger } from "@/components/ui/select";
import { Check, Plus, Trash } from "lucide-react";
import { Separator } from "../ui/separator";
import { useState } from "react";

export interface Prompt {
  id: string;
  name: string;
  content: string;
}

interface PromptEditorProps {
  prompts: Prompt[];
  onPromptsChange: (prompts: Prompt[]) => void;
  selectedId: string | null;
  onSelectedChange: (id: string | null) => void;
}

export function PromptEditor({
  prompts,
  onPromptsChange,
  selectedId,
  onSelectedChange,
}: PromptEditorProps) {
  const [open, setOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("New Prompt");

  const selected = prompts.find((p) => p.id === selectedId);

  const handleSelect = (id: string) => {
    onSelectedChange(id);
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    const newPrompts = prompts.filter((p) => p.id !== id);
    onPromptsChange(newPrompts);
    if (selectedId === id) {
      onSelectedChange(newPrompts[0]?.id || null);
    }
  };

  const handleAdd = () => {
    const id = crypto.randomUUID();
    const name = newName.trim() || "New Prompt";
    const newPrompts = [...prompts, { id, name, content: "" }];
    onPromptsChange(newPrompts);
    onSelectedChange(id);
    setIsAdding(false);
    setNewName("New Prompt");
    setOpen(false);
  };

  const handleContentChange = (value: string) => {
    if (selected) {
      const newPrompts = prompts.map((p) =>
        p.id === selected.id ? { ...p, content: value } : p
      );
      onPromptsChange(newPrompts);
    }
  };

  return (
    <div className="rounded-md border">
      <Select open={open} onOpenChange={setOpen}>
        <SelectTrigger className="w-full justify-between rounded-none border-0 shadow-none h-9 px-3 py-2 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:border-transparent bg-transparent">
          <p className="text-primary">
            {selected ? selected.name : "Select prompt..."}
          </p>
        </SelectTrigger>
        <SelectContent>
          <div className="flex flex-col">
            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className="flex items-center justify-between px-1 text-sm hover:bg-accent cursor-pointer rounded-md"
                onClick={() => handleSelect(prompt.id)}
              >
                <span className="flex-1 truncate pr-2">{prompt.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(prompt.id);
                  }}
                >
                  <Trash className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
            {isAdding ? (
              <div className="flex items-center gap-2 px-2 py-1.5">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAdd();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdd();
                  }}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Separator className="my-1 text-muted-foreground" />
                <div
                  className="flex items-center gap-1 p-1 text-sm hover:bg-accent cursor-pointer rounded-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAdding(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  New Prompt
                </div>
              </>
            )}
          </div>
        </SelectContent>
      </Select>

      <div className="border-t">
        <Textarea
          value={selected ? selected.content : ""}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Prompt content..."
          className="w-full field-sizing-content resize-none border-0 rounded-none shadow-none focus-visible:ring-0 px-3 py-2"
        />
      </div>
    </div>
  );
}
