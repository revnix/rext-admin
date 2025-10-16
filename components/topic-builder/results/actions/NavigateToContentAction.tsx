"use client";
import { SimpleErrorDisplay } from "./SimpleErrorDisplay";

/**
 * Navigate to Content Action Component
 * Handles navigation to content creation page
 */

import { Loader2, PenTool } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SuccessAlert } from "@/components/ui/error-alert";
import { useNavigateToContent } from "./hooks/useNavigateToContent";
import type { BaseActionProps } from "./types";

interface NavigateToContentActionProps extends BaseActionProps {
  onNavigateToContent?: (topicId: string) => void;
  variant?: "button" | "dropdown-item";
}

export function NavigateToContentAction({
  topic,
  onNavigateToContent,
  disabled = false,
  showLabel = true,
  variant = "button",
}: NavigateToContentActionProps) {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const { navigateToContent, isNavigating } = useNavigateToContent();

  const handleNavigate = () => {
    setError(undefined);
    setSuccess(undefined);

    const result = navigateToContent(topic.id, onNavigateToContent);

    if (result.success) {
      setSuccess(result.message);
    } else {
      setError(result.message);
    }
  };

  if (variant === "dropdown-item") {
    return (
      <button
        type="button"
        onClick={handleNavigate}
        className="flex w-full items-center text-left"
      >
        <PenTool className="mr-2 h-4 w-4" />
        Write Content
      </button>
    );
  }

  return (
    <>
      <Button
        variant="default"
        size="sm"
        onClick={handleNavigate}
        disabled={disabled || isNavigating}
        className="gap-1.5 cursor-pointer"
      >
        {isNavigating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <PenTool className="h-4 w-4" />
        )}
        {showLabel && "Write Content"}
      </Button>

      {error && (
        <SimpleErrorDisplay
          message={error || ""}
          onRetry={() => {
            setError(undefined);
            handleNavigate();
          }}
        />
      )}
      {success && <SuccessAlert message={success} />}
    </>
  );
}
