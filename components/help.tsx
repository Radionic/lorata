import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

export function Help({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  );
}
