"use client";

import { useState, useEffect } from "react";
import { ImageEditItem } from "@/components/tasks/items/image-editing-item";
import { TaskItemsResponse } from "@/lib/queries/use-task-item";
import {
  ImageEditingTaskItem,
  TextToImageTaskItem,
  TextToVideoTaskItem,
  ImageToVideoTaskItem,
} from "@/lib/types";
import { match } from "ts-pattern";
import { TextToImageItem } from "./items/text-to-image-item";
import { TextToVideoItem } from "./items/text-to-video-item";
import { ImageToVideoItem } from "./items/image-to-video-item";
import { cn } from "@/lib/utils";
import { Info, X } from "lucide-react";
import { useLocalStorage } from "usehooks-ts";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Label } from "../ui/label";
import { TaskItem } from "@/lib/db/schema";

export function TaskItemsPage({
  taskId,
  taskType,
  taskItems,
  page,
  setPage,
}: {
  taskId: string;
  taskType?:
    | "text-to-image"
    | "image-editing"
    | "text-to-video"
    | "image-to-video";
  taskItems?: TaskItemsResponse<TaskItem>;
  page: number;
  setPage: (newPage: number) => void;
}) {
  const [pageInput, setPageInput] = useState("");

  const items = taskItems?.items;
  const pagination = taskItems?.pagination;

  const [showI2VExportBanner, setShowI2VExportBanner] = useLocalStorage(
    "show-i2v-export-banner",
    true
  );

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [page]);

  if (!taskType || !items?.length) {
    return (
      <p className="text-center text-lg text-muted-foreground">
        No items found
      </p>
    );
  }

  return (
    <>
      {taskType === "image-to-video" && showI2VExportBanner && (
        <div className="mb-8 flex items-center gap-2 rounded-md bg-blue-500/10 border border-blue-500/20 px-3 py-2 text-sm text-blue-700">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="flex-1">
            You can leave the source image blank to automatically use the first
            frame of the target video as the source image when exporting.
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 -mt-0.5 -mr-1 hover:bg-blue-500/20 text-blue-700"
            onClick={() => setShowI2VExportBanner(true)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <div
        className={cn(
          "grid gap-6",
          taskType === "text-to-image" || taskType === "text-to-video"
            ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {match(taskType)
          .with("text-to-image", () =>
            items?.map((item) => (
              <TextToImageItem
                key={item.id}
                taskId={taskId}
                item={item as TextToImageTaskItem}
              />
            ))
          )
          .with("text-to-video", () =>
            items?.map((item) => (
              <TextToVideoItem
                key={item.id}
                taskId={taskId}
                item={item as TextToVideoTaskItem}
              />
            ))
          )
          .with("image-to-video", () =>
            items?.map((item) => (
              <ImageToVideoItem
                key={item.id}
                taskId={taskId}
                item={item as ImageToVideoTaskItem}
              />
            ))
          )
          .with("image-editing", () =>
            items?.map((item) => (
              <ImageEditItem
                key={item.id}
                taskId={taskId}
                item={item as ImageEditingTaskItem}
              />
            ))
          )
          .exhaustive()}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage(Math.max(1, page - 1))}
                  className={cn(
                    page === 1 && "pointer-events-none opacity-50",
                    "cursor-pointer"
                  )}
                />
              </PaginationItem>

              {/* First page */}
              {pagination.totalPages > 0 && (
                <PaginationItem>
                  <PaginationLink
                    onClick={() => setPage(1)}
                    isActive={page === 1}
                    className="cursor-pointer"
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
              )}

              {/* Left ellipsis */}
              {page > 3 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {/* Middle pages */}
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p > 1 &&
                    p < pagination.totalPages &&
                    Math.abs(p - page) <= 1
                )
                .map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      onClick={() => setPage(p)}
                      isActive={page === p}
                      className="cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}

              {/* Right ellipsis */}
              {page < pagination.totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {/* Last page */}
              {pagination.totalPages > 1 && (
                <PaginationItem>
                  <PaginationLink
                    onClick={() => setPage(pagination.totalPages)}
                    isActive={page === pagination.totalPages}
                    className="cursor-pointer"
                  >
                    {pagination.totalPages}
                  </PaginationLink>
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setPage(Math.min(pagination.totalPages, page + 1))
                  }
                  className={cn(
                    page === pagination.totalPages &&
                      "pointer-events-none opacity-50",
                    "cursor-pointer"
                  )}
                />
              </PaginationItem>

              {/* Page jump input */}
              <PaginationItem className="ml-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const pageNum = parseInt(pageInput, 10);
                    if (
                      !isNaN(pageNum) &&
                      pageNum >= 1 &&
                      pageNum <= pagination.totalPages
                    ) {
                      setPage(pageNum);
                      setPageInput("");
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Label>Go to</Label>
                  <Input
                    type="number"
                    min="1"
                    max={pagination.totalPages}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    placeholder={page.toString()}
                    className="h-9 w-12 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </form>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  );
}
