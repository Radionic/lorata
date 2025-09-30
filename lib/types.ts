import { Task as DBTask, TaskItem as DBTaskItem } from "@/lib/db/schema";

export interface Task extends DBTask {
  items: TaskItem[];
  itemCount: number;
}

export interface TaskItem extends DBTaskItem {}

export interface TextToImageTaskItemData {
  instruction?: string;
  image?: string;
}

export interface ImageEditingTaskItemData {
  instruction?: string;
  sourceImages?: string[];
  targetImage?: string;
}

export interface TextToVideoTaskItemData {
  instruction?: string;
  video?: string;
}

export interface ImageToVideoTaskItemData {
  instruction?: string;
  sourceImage?: string;
  targetVideo?: string;
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
