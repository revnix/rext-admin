"use client";

import { MessageSquare, Sparkles } from "lucide-react";
import { useCallback } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import type { SelectOption } from "@/types/shared";

interface ToneSelectorProps {
  value?: string[];
  options: SelectOption[];
  label?: string;
  description?: string;
  maxSelections?: number;
  error?: string;
  touched?: boolean;
  suggestions?: string[];
  audienceContext?: string;
  readingLevelContext?: string;
  onChange: (tones: string[]) => void;
  onTouch?: () => void;
}

/**
 * Specialized Tone Selector Component
 *
 * Multi-select tone picker with intelligent suggestions based on audience
 * and reading level context. Supports visual feedback and limits.
 */
export function ToneSelector({
  value = [],
  options,
  label = "Tone Selection",
  description = "Select up to 3 tones that match your brand and audience",
  maxSelections = 3,
  error,
  touched,
  suggestions = [],
  audienceContext,
  readingLevelContext,
  onChange,
  onTouch,
}: ToneSelectorProps) {
  // Handle tone change
  const handleToneChange = useCallback(
    (tone: string, isChecked: boolean) => {
      if (isChecked) {
        // Add if under limit
        if (value.length < maxSelections) {
          const newTones = [...value, tone];
          onChange(newTones);
        }
      } else {
        // Remove
        const newTones = value.filter((t) => t !== tone);
        onChange(newTones);
      }

      onTouch?.();
    },
    [value, maxSelections, onChange, onTouch],
  );

  // Check if tone is suggested
  const isToneSuggested = useCallback(
    (tone: string) => {
      return suggestions.includes(tone);
    },
    [suggestions],
  );

  // Generate smart suggestions text
  const getContextualDescription = useCallback(() => {
    if (!audienceContext && !readingLevelContext) return description;

    const contextParts = [];
    if (audienceContext) contextParts.push(`${audienceContext} audience`);
    if (readingLevelContext)
      contextParts.push(`${readingLevelContext} reading level`);

    return `${description} (Suggestions based on your ${contextParts.join(" and ")})`;
  }, [description, audienceContext, readingLevelContext]);

  return (
    <Card
      className={`wizard-card ${error && touched ? "wizard-card-error" : ""}`}
    >
      <CardHeader className="pb-4">
        <CardTitle className="wizard-field-label">
          <MessageSquare className="h-5 w-5 text-foreground" />
          {label}
        </CardTitle>
        <CardDescription className="wizard-field-description">
          {getContextualDescription()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enhanced Tone Grid */}
        <div className="wizard-grid-4">
          {options.map((option) => {
            const isSelected = value.includes(option.value);
            const isDisabled = !isSelected && value.length >= maxSelections;
            const isSuggested = isToneSuggested(option.value);

            return (
              <Label
                key={option.value}
                className={`relative wizard-card-interactive ${
                  isSelected
                    ? "wizard-card-selected"
                    : isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={(e) =>
                    handleToneChange(option.value, e.target.checked)
                  }
                  className="sr-only"
                />
                <div className="text-center">
                  <span className="font-medium text-sm">{option.label}</span>
                  {option.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  )}
                </div>

                {/* Enhanced suggestion indicator */}
                {isSuggested && !isSelected && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-3 h-3 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full border border-yellow-200 shadow-sm">
                      <div className="w-1 h-1 bg-white rounded-full m-0.5"></div>
                    </div>
                  </div>
                )}
              </Label>
            );
          })}
        </div>

        {/* Smart suggestions alert */}
        {suggestions.length > 0 && (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              <strong>AI Suggestions:</strong>
              <div className="mt-2 space-y-1 text-sm">
                {suggestions.slice(0, 3).map((suggestion, _index) => {
                  const option = options.find(
                    (opt) => opt.value === suggestion,
                  );
                  if (!option) return null;

                  return (
                    <div key={suggestion} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-yellow-400 rounded-full"></div>
                      <span>
                        <strong>{option.label}</strong> - {option.description}
                      </span>
                    </div>
                  );
                })}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced selected tones preview */}
        {value.length > 0 && (
          <div className="wizard-card-success p-4 rounded-md">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-foreground mt-0.5" />
              <div>
                <div className="font-semibold text-green-700 mb-2">
                  Selected Tones
                </div>
                <div className="flex flex-wrap gap-2">
                  {value.map((tone) => (
                    <Badge
                      key={tone}
                      variant="default"
                      className="text-xs bg-green-100 text-green-700 border-green-200"
                    >
                      {tone}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced count display */}
        <div className="text-sm text-center">
          <span
            className={
              value.length === 0
                ? "text-muted-foreground"
                : "text-primary font-medium"
            }
          >
            {value.length} / {maxSelections} selected
          </span>
          {value.length === 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              Recommended: 1-3 tones for best results
            </div>
          )}
          {value.length >= maxSelections && (
            <div className="text-xs text-yellow-600 mt-1">
              Maximum reached - deselect a tone to choose another
            </div>
          )}
        </div>

        {/* Enhanced error display */}
        {error && touched && (
          <div className="wizard-field-error">
            <MessageSquare className="h-4 w-4" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
