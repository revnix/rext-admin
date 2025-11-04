"use client";

import { RouteError } from "@/components/ui/route-error";

/**
 * Knowledge Base Error Boundary
 */
export default function KnowledgeError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="Knowledge Base Error"
      logContext="KnowledgeError"
      layout="container"
      navigationType="back"
    />
  );
}
