"use client";

import LexicalEditor from "@/components/ui/lexical-editor";
import { ErrorBoundary } from "@/components/ui/error-boundary";

interface SafeLexicalEditorProps {
  initialValue?: string;
  onChange?: (markdown: string) => void;
  readOnly?: boolean;
  showDebug?: boolean;
  toolbarClass?: string;
}

function LexicalEditorFallback({
  error,
  resetError,
}: {
  error: Error;
  resetError: () => void;
  errorId: string;
  requestId?: string;
}) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 space-y-2">
      <p className="text-sm font-medium text-destructive">
        Editor failed to load
      </p>
      <p className="text-xs text-muted-foreground">{error.message}</p>
      <button
        type="button"
        onClick={resetError}
        className="text-xs font-medium underline underline-offset-2"
      >
        Retry editor
      </button>
    </div>
  );
}

export function SafeLexicalEditor(props: SafeLexicalEditorProps) {
  return (
    <ErrorBoundary fallback={LexicalEditorFallback}>
      <LexicalEditor {...props} />
    </ErrorBoundary>
  );
}
