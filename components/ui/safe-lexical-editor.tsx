"use client";

import LexicalEditor from "@/components/ui/lexical-editor";
import { ErrorBoundary } from "@/components/ui/error-boundary";

interface SafeLexicalEditorProps {
  initialValue?: string;
  onChange?: (markdown: string) => void;
  readOnly?: boolean;
  showDebug?: boolean;
  toolbarClass?: string;
  onRequestEdit?: () => void;
  toolbar?: boolean;
  plugins?: React.ReactNode;
  bare?: boolean;
}

export function SafeLexicalEditor(props: SafeLexicalEditorProps) {
  return (
    <ErrorBoundary title="The editor didn't load">
      <LexicalEditor {...props} />
    </ErrorBoundary>
  );
}
