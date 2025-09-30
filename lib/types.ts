import { Task as DBTask, TaskItem as DBTaskItem } from "@/lib/db/schema";

export interface Task extends DBTask {
  items: TaskItem[];
  itemCount: number;
}

export interface TaskItem extends DBTaskItem {}

export interface TextToImageTaskItemData {
  instruction: string | null;
  image: string | null;
}

export interface ImageEditingTaskItemData {
  instruction: string | null;
  sourceImages: string[] | null;
  targetImage: string | null;
}

export interface TextToVideoTaskItemData {
  instruction: string | null;
  video: string | null;
}

export interface ImageToVideoTaskItemData {
  instruction: string | null;
  sourceImage: string | null;
  targetVideo: string | null;
}

export interface TextToImageTaskItem extends TaskItem {
  data: TextToImageTaskItemData;
}

export interface ImageEditingTaskItem extends TaskItem {
  data: ImageEditingTaskItemData;
}

export interface TextToVideoTaskItem extends TaskItem {
  data: TextToVideoTaskItemData;
}

export interface ImageToVideoTaskItem extends TaskItem {
  data: ImageToVideoTaskItemData;
}
