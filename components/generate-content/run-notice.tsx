import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** A run that could not go on: what happened, why, and the one way forward. */
export function RunNotice({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-auto my-8 flex w-full max-w-2xl items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 wrap-anywhere text-sm text-muted-foreground">
          {message}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
