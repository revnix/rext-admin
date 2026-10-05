"use client";

import { Progress as ProgressPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-secondary/20",
      className,
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 bg-primary transition-all",
        indicatorClassName,
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

interface CircularProgressProps {
  value: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showValue?: boolean;
  strokeWidth?: number;
}

const CircularProgress = React.memo<CircularProgressProps>(
  ({ value, size = "md", className, showValue = true, strokeWidth }) => {
    const sizeConfig = {
      sm: {
        width: 32,
        height: 32,
        fontSize: "text-xs",
        stroke: strokeWidth || 2,
      },
      md: {
        width: 40,
        height: 40,
        fontSize: "text-sm",
        stroke: strokeWidth || 2.5,
      },
      lg: {
        width: 48,
        height: 48,
        fontSize: "text-base",
        stroke: strokeWidth || 3,
      },
    };

    const config = sizeConfig[size];
    const radius = (config.width - config.stroke * 2) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <div
        className={cn(
          "relative inline-flex items-center justify-center",
          className,
        )}
      >
        <svg
          width={config.width}
          height={config.height}
          className="transform -rotate-90"
          role="img"
          aria-label={`Progress: ${Math.round(value)}%`}
        >
          <circle
            cx={config.width / 2}
            cy={config.height / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={config.stroke}
            fill="transparent"
            className="text-muted-foreground/20"
          />
          <circle
            cx={config.width / 2}
            cy={config.height / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={config.stroke}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-primary transition-all duration-300 ease-in-out"
          />
        </svg>
        {showValue && (
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center font-medium",
              config.fontSize,
            )}
          >
            {Math.round(value)}
          </span>
        )}
      </div>
    );
  },
);

CircularProgress.displayName = "CircularProgress";

export { Progress, CircularProgress };
