"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Check } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

interface RadioOption {
  label: string;
  value: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

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

          return (
            <div key={option.value} className="relative">
              <RadioGroupPrimitive.Item
                value={option.value}
                id={option.value}
                className={cn("peer sr-only")}
              />
              <label
                htmlFor={option.value}
                className={cn(
                  "flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all duration-200",
                  "hover:bg-accent hover:text-accent-foreground hover:border-accent",
                  isSelected
                    ? "bg-primary/10 border-primary ring-2 ring-primary/30 text-primary shadow-sm"
                    : "border-border bg-background hover:shadow-sm",
                  "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
                )}
              >
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border-2 mt-0.5 shrink-0",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground",
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
                          isSelected ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        "font-medium text-sm",
                        isSelected ? "text-primary" : "text-foreground",
                      )}
                    >
                      {option.label}
                    </span>
                  </div>
                  {option.description && (
                    <p
                      className={cn(
                        "text-xs",
                        isSelected
                          ? "text-primary/70"
                          : "text-muted-foreground",
                      )}
                    >
                      {option.description}
                    </p>
                  )}
                </div>
              </label>
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
