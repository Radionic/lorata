"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RenameTaskDialog } from "@/components/rename-task-dialog";
import { Task } from "@/lib/types";
import { useState } from "react";
import { Edit, FileImage, MoreVertical } from "lucide-react";

export function TaskCard({ task }: { task: Task }) {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);

  return (
    <>
      <Link href={`/tasks/${task.id}`}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileImage className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">{task.name}</CardTitle>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="p-1 hover:bg-gray-100 rounded-sm transition-colors cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameDialogOpen(true);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardDescription>{task.type}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{task.itemCount} items</span>
              <span>{new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      </Link>

      {renameDialogOpen && (
        <RenameTaskDialog
          open={renameDialogOpen}
          onOpenChange={setRenameDialogOpen}
          task={task}
        />
      )}
    </>
  );
}
