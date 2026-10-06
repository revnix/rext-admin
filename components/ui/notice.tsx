import { cva } from "class-variance-authority";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  type LucideIcon,
  X,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type NoticeTone = "info" | "warning" | "danger" | "success";

const noticeVariants = cva(
  "flex w-full items-start gap-3 rounded-(--card-radius) border px-4 py-3 text-sm",
  {
    variants: {
      tone: {
        info: "border-info-200 bg-info-50 text-info-700",
        warning: "border-warning-200 bg-warning-50 text-warning-700",
        danger: "border-danger-200 bg-danger-50 text-danger-700",
        success: "border-success-200 bg-success-50 text-success-700",
      },
    },
    defaultVariants: { tone: "info" },
  },
);

const ICON: Record<NoticeTone, LucideIcon> = {
  info: Info,
  warning: AlertTriangle,
  danger: XCircle,
  success: CheckCircle2,
};

/**
 * The one box for something the person should know (design/app-language.md §6 and §8): what
 * happened and what to do. A tone, its icon, a title, a sentence or two, and at most one action.
 * Danger and warning are announced at once (`role="alert"`); info and success wait their turn.
 * `onDismiss` adds a close button for a notice the person may put away.
 */
export function Notice({
  tone = "info",
  title,
  children,
  action,
  onDismiss,
  dismissLabel = "Dismiss",
  className,
}: {
  tone?: NoticeTone;
  title?: ReactNode;
  children?: ReactNode;
  /** One button or link, at the end. */
  action?: ReactNode;
  onDismiss?: () => void;
  /** The close button's name for assistive technology. */
  dismissLabel?: string;
  className?: string;
}) {
  const Icon = ICON[tone];
  return (
    <div
      data-slot="notice"
      data-tone={tone}
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cn(noticeVariants({ tone }), className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      {/* The action sits beside the words while they keep 16 rem, and goes under them when the
          notice is narrower (a phone, a dialog, a card's column). */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex min-w-0 grow basis-64 flex-col gap-0.5">
          {title && <p className="font-medium">{title}</p>}
          {children && <div className="text-foreground/80">{children}</div>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {onDismiss && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          aria-label={dismissLabel}
          // 28 px, with a 40 px touch area under 1024 px that leaves the notice's height alone.
          className="relative -my-1 -mr-2 size-7 shrink-0 text-current after:absolute after:-inset-1.5 lg:after:hidden"
        >
          <X className="size-4" aria-hidden />
        </Button>
      )}
    </div>
  );
}
