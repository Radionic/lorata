import { Task as DBTask, TaskItem as DBTaskItem } from "@/lib/db/schema";

export interface Task extends DBTask {
  items: TaskItem[];
  itemCount: number;
}

export interface TaskItem extends DBTaskItem {}

export interface TextToImageTaskItem extends TaskItem {
  data: {
    instruction?: string;
    image?: string;
  };
}

export interface ImageEditingTaskItem extends TaskItem {
  data: {
    instruction?: string;
    sourceImage?: string;
    targetImage?: string;
  };
}
