"use client";

import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { Check } from "lucide-react";
import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { SelectOption } from "@/types/shared";

type RadioOption = SelectOption;

interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  name?: string;
  disabled?: boolean;
  orientation?: "horizontal" | "vertical";
  columns?: 1 | 2 | 3 | 4;
}

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(
  (
    {
      options,
      value,
      onValueChange,
      className,
      orientation = "vertical",
      columns = 1,
      ...props
    },
    ref,
  ) => {
    const gridCols = {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    };

    return (
      <RadioGroupPrimitive.Root
        ref={ref}
        className={cn("grid gap-3", gridCols[columns], className)}
        orientation={orientation}
        value={value}
        onValueChange={onValueChange}
        {...props}
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          const OptionIcon = option.icon;
          const isDisabled = option.disabled;

          const labelClasses = cn(
            "flex items-start gap-3 rounded-md border-2 p-4 transition-all duration-200",
            isDisabled ? "cursor-not-allowed" : "cursor-pointer",
            isDisabled
              ? "border-border/70 bg-muted text-muted-foreground"
              : "border-border bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent hover:shadow-sm",
            isSelected
              ? "bg-primary/10 border-primary ring-2 ring-primary/30 text-primary shadow-sm"
              : undefined,
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-60",
            // The radio itself is visually hidden: its card shows the keyboard focus.
            "peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50",
          );

          const labelContent = (
            <label
              htmlFor={option.value}
              className={labelClasses}
              aria-disabled={isDisabled}
            >
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border-2 mt-0.5 shrink-0",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground",
                  isDisabled && !isSelected ? "bg-muted" : undefined,
                )}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  {OptionIcon && (
                    <OptionIcon
                      className={cn(
                        "h-4 w-4",
                        isDisabled
                          ? "text-muted-foreground"
                          : isSelected
                            ? "text-foreground"
                            : "text-muted-foreground",
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      "font-medium text-sm",
                      isDisabled
                        ? "text-muted-foreground"
                        : isSelected
                          ? "text-primary"
                          : "text-foreground",
                    )}
                  >
                    {option.label}
                  </span>
                </div>
                {option.description && (
                  <p
                    className={cn(
                      "text-xs",
                      isDisabled
                        ? "text-muted-foreground"
                        : isSelected
                          ? "text-primary/70"
                          : "text-muted-foreground",
                    )}
                  >
                    {option.description}
                  </p>
                )}
              </div>
            </label>
          );

          const contentWithTooltip =
            isDisabled && option.tooltip ? (
              <Tooltip>
                <TooltipTrigger asChild>{labelContent}</TooltipTrigger>
                <TooltipContent>{option.tooltip}</TooltipContent>
              </Tooltip>
            ) : (
              labelContent
            );

          return (
            <div key={option.value} className="relative">
              <RadioGroupPrimitive.Item
                value={option.value}
                id={option.value}
                disabled={isDisabled}
                className={cn("peer sr-only")}
              />
              {contentWithTooltip}
            </div>
          );
        })}
      </RadioGroupPrimitive.Root>
    );
  },
);

RadioGroup.displayName = "RadioGroup";

export { RadioGroup };
export type { RadioOption };
