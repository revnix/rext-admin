"use client";

import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuestionAnswerLayoutProps {
  /** Question section content */
  question: {
    label: string;
    description?: string;
    icon?: LucideIcon;
  };

  /** Answer section - rendered as children */
  children: React.ReactNode;

  /** Whether this field was auto-filled from topic */
  isAutoFilled?: boolean;

  /** Whether user has modified this field */
  isModified?: boolean;

  /** Error message to display */
  error?: string;

  /** Whether field has error and should show error state */
  hasError?: boolean;

  /** Additional CSS classes */
  className?: string;
}

/**
 * Question-Answer Layout Component
 *
 * Displays form questions in a horizontal 30/70 split layout:
 * - Left 30%: Question label, description, icon, and auto-fill indicator
 * - Right 70%: Answer controls (form inputs, radio groups, etc.)
 *
 * Responsive:
 * - Desktop (≥1024px): Horizontal 30/70 split
 * - Mobile/Tablet (<1024px): Stacked vertical layout
 *
 * @example
 * ```tsx
 * <QuestionAnswerLayout
 *   question={{
 *     label: "Platform",
 *     description: "Where will this content be published?",
 *     icon: Globe,
 *   }}
 *   isAutoFilled={true}
 *   hasError={!!error}
 *   error={error}
 * >
 *   <RadioGroup options={options} value={value} onChange={onChange} />
 * </QuestionAnswerLayout>
 * ```
 */
export function QuestionAnswerLayout({
  question,
  children,
  isAutoFilled = false,
  isModified = false,
  error,
  hasError = false,
  className,
}: QuestionAnswerLayoutProps) {
  const Icon = question.icon;
  const showAutoFillBadge = isAutoFilled && !isModified;

  return (
    <Card
      className={cn(
        "transition-colors",
        hasError && "border-destructive",
        className,
      )}
    >
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[30%_70%] gap-2">
          {/* Question Section - 30% */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              {Icon && (
                <Icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              )}
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-foreground">
                    {question.label}
                  </h3>
                  {showAutoFillBadge && (
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <Sparkles className="h-3 w-3" />
                      Auto-filled
                    </Badge>
                  )}
                </div>
                {question.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {question.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Answer Section - 70% */}
          <div className="space-y-3">
            {children}

            {/* Error Message */}
            {hasError && error && (
              <div className="flex items-start gap-2 text-sm text-destructive">
                {Icon && <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
