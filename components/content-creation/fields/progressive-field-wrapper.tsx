"use client";

import { ChevronDown, Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { WizardField } from "@/types/content-creation";

interface ProgressiveFieldWrapperProps {
  /** Whether this field should be visible in progressive disclosure */
  isProgressivelyVisible: boolean;
  /** Whether there are more fields coming after this one */
  hasMoreFields: boolean;
  /** The next field that will be revealed (for hint) */
  nextField?: WizardField | null;
  /** Children to render (the actual field content) */
  children: React.ReactNode;
  /** Optional className for the wrapper */
  className?: string;
}

/**
 * Wrapper component that handles progressive field disclosure with smooth animations
 */
export function ProgressiveFieldWrapper({
  isProgressivelyVisible,
  hasMoreFields,
  nextField,
  children,
  className = "",
}: ProgressiveFieldWrapperProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);

  // Handle visibility state changes with animation
  useEffect(() => {
    if (isProgressivelyVisible && !isVisible) {
      // Small delay for smooth animation
      const timer = setTimeout(() => {
        setIsVisible(true);

        // Scroll into view if needed
        if (fieldRef.current) {
          fieldRef.current.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest",
          });
        }
      }, 100);

      return () => clearTimeout(timer);
    } else if (!isProgressivelyVisible && isVisible) {
      setIsVisible(false);
    }
  }, [isProgressivelyVisible, isVisible]);

  // Show hint after field is visible and user might need guidance
  useEffect(() => {
    if (isVisible && hasMoreFields && nextField) {
      const timer = setTimeout(() => {
        setShowHint(true);
      }, 1000); // Show hint after 1 second

      return () => clearTimeout(timer);
    } else {
      setShowHint(false);
    }
  }, [isVisible, hasMoreFields, nextField]);

  // Don't render anything if not progressively visible
  if (!isProgressivelyVisible) {
    return null;
  }

  return (
    <div
      ref={fieldRef}
      className={`transition-all duration-500 ease-out ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-4 scale-98"
      } ${className}`}
    >
      {/* Main field content */}
      <div
        className={`transform transition-all duration-300 ${
          isVisible ? "translate-x-0" : "translate-x-2"
        }`}
      >
        {children}
      </div>

      {/* Next field hint */}
      {showHint && hasMoreFields && nextField && (
        <Collapsible>
          <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30 transition-all duration-300 opacity-100 transform translate-y-0">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Info className="h-3 w-3 text-primary" />
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    Next: {nextField.label}
                  </p>
                  {nextField.required && (
                    <Badge variant="secondary" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>

                {nextField.helpText && (
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <span className="flex items-center gap-1">
                        <ChevronDown className="h-3 w-3" />
                        What's this?
                      </span>
                    </Button>
                  </CollapsibleTrigger>
                )}
              </div>
            </div>

            {nextField.helpText && (
              <CollapsibleContent className="mt-2">
                <p className="text-xs text-muted-foreground pl-9">
                  {nextField.helpText}
                </p>
              </CollapsibleContent>
            )}
          </div>
        </Collapsible>
      )}
    </div>
  );
}
