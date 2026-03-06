import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface OverflowCountTooltipProps {
  count: number;
  content: ReactNode;
  badgeClassName: string;
  contentClassName?: string;
}

export function OverflowCountTooltip({
  count,
  content,
  badgeClassName,
  contentClassName = "max-w-xs",
}: OverflowCountTooltipProps) {
  if (count <= 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={badgeClassName}>+{count}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className={contentClassName}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
