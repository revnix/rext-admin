"use client";

import { Hash, Plus, Sparkles, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface KeywordTagInputProps {
  value?: string[];
  label?: string;
  description?: string;
  placeholder?: string;
  maxKeywords?: number;
  icon?: React.ComponentType<{ className?: string }>;
  error?: string;
  touched?: boolean;
  suggestions?: string[];
  topicSuggestions?: string[];
  onChange: (keywords: string[]) => void;
  onTouch?: () => void;
}

/**
 * Specialized Keyword Tag Input Component
 *
 * Handles adding, removing, and managing keyword tags with suggestions,
 * validation, and visual feedback. Supports AI-generated suggestions.
 */
export function KeywordTagInput({
  value = [],
  label = "Keywords",
  description,
  placeholder = "Enter keywords...",
  maxKeywords = 10,
  icon: Icon = Hash,
  error,
  touched,
  suggestions = [],
  topicSuggestions = [],
  onChange,
  onTouch,
}: KeywordTagInputProps) {
  const [inputValue, setInputValue] = useState("");

  // Handle adding new keyword
  const handleAddKeyword = useCallback(() => {
    const trimmedValue = inputValue.trim().toLowerCase();

    if (!trimmedValue) return;

    // Check for duplicates
    if (value.includes(trimmedValue)) {
      setInputValue("");
      return;
    }

    // Check max limit
    if (value.length >= maxKeywords) {
      return;
    }

    const newKeywords = [...value, trimmedValue];
    onChange(newKeywords);
    setInputValue("");
    onTouch?.();
  }, [inputValue, value, maxKeywords, onChange, onTouch]);

  // Handle removing keyword
  const handleRemoveKeyword = useCallback(
    (keywordToRemove: string) => {
      const newKeywords = value.filter(
        (keyword) => keyword !== keywordToRemove,
      );
      onChange(newKeywords);
      onTouch?.();
    },
    [value, onChange, onTouch],
  );

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (value.includes(suggestion) || value.length >= maxKeywords) {
        return;
      }

      const newKeywords = [...value, suggestion];
      onChange(newKeywords);
      onTouch?.();
    },
    [value, maxKeywords, onChange, onTouch],
  );

  // Handle key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddKeyword();
      } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
        // Remove last keyword when backspace on empty input
        handleRemoveKeyword(value[value.length - 1]);
      }
    },
    [handleAddKeyword, inputValue, value, handleRemoveKeyword],
  );

  const isAtLimit = value.length >= maxKeywords;
  const canAddCurrent =
    inputValue.trim() &&
    !value.includes(inputValue.trim().toLowerCase()) &&
    !isAtLimit;

  return (
    <Card
      className={`transition-colors ${error && touched ? "border-destructive" : ""}`}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {label}
        </CardTitle>
        <CardDescription>
          {description}
          {maxKeywords && (
            <span className="block mt-1 text-xs text-muted-foreground">
              {value.length}/{maxKeywords} keywords
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Row */}
        <div className="flex gap-2">
          <Input
            placeholder={isAtLimit ? "Maximum keywords reached" : placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1"
            disabled={isAtLimit}
          />
          <Button
            onClick={handleAddKeyword}
            disabled={!canAddCurrent}
            type="button"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {/* Current Keywords */}
        {value.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current keywords:</Label>
            <div className="flex flex-wrap gap-2">
              {value.map((keyword) => (
                <Badge
                  key={keyword}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground group transition-colors"
                  onClick={() => handleRemoveKeyword(keyword)}
                >
                  {keyword}
                  <X className="h-3 w-3 ml-1 opacity-50 group-hover:opacity-100" />
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Click on a keyword to remove it
            </p>
          </div>
        )}

        {/* Topic Suggestions */}
        {topicSuggestions.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Hash className="h-3 w-3" />
              Suggested from topic:
            </Label>
            <div className="flex flex-wrap gap-2">
              {topicSuggestions
                .filter((suggestion) => !value.includes(suggestion))
                .slice(0, 8)
                .map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className={`cursor-pointer transition-colors ${
                      isAtLimit
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-blue-500 hover:text-white"
                    }`}
                    onClick={() =>
                      !isAtLimit && handleSuggestionClick(suggestion)
                    }
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {suggestion}
                  </Badge>
                ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Click to add keywords related to your selected topic
            </p>
          </div>
        )}

        {/* AI Suggestions (fallback) */}
        {suggestions.length > 0 && topicSuggestions.length === 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI Suggestions:
            </Label>
            <div className="flex flex-wrap gap-2">
              {suggestions
                .filter((suggestion) => !value.includes(suggestion))
                .slice(0, 8)
                .map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className={`cursor-pointer transition-colors ${
                      isAtLimit
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-primary hover:text-primary-foreground"
                    }`}
                    onClick={() =>
                      !isAtLimit && handleSuggestionClick(suggestion)
                    }
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {suggestion}
                  </Badge>
                ))}
            </div>
          </div>
        )}

        {/* Help Text */}
        {value.length === 0 && !error && (
          <Alert>
            <Hash className="h-4 w-4" />
            <AlertDescription>
              Start typing and press Enter to add keywords. These help AI
              understand your content focus.
            </AlertDescription>
          </Alert>
        )}

        {/* Limit Warning */}
        {isAtLimit && (
          <Alert>
            <AlertDescription>
              Maximum number of keywords reached ({maxKeywords}). Remove some
              keywords to add new ones.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {error && touched && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
