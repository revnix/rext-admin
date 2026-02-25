import type { ReactNode } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface TruncatedTooltipTextProps {
    trigger: ReactNode;
    content: ReactNode;
    side?: "top" | "right" | "bottom" | "left";
    className?: string;
}

export function TruncatedTooltipText({
    trigger,
    content,
    side = "bottom",
    className,
}: TruncatedTooltipTextProps) {
    if (!content) {
        return <>{trigger}</>;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{trigger}</TooltipTrigger>
                <TooltipContent side={side} className={className}>
                    {content}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
