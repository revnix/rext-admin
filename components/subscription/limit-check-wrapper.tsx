"use client";

import { AlertTriangle, Lock, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useResourceLimit } from "./usage-limit-warning";
import type { Route } from "next";

/**
 * Limit Check Wrapper Component
 *
 * Wraps create/action buttons and prevents actions when limits are reached.
 * Displays inline warnings and blocks interactions.
 *
 * Usage:
 * ```tsx
 * <LimitCheckWrapper resource="workspaces" actionName="Create Workspace">
 *   <Button onClick={handleCreate}>Create Workspace</Button>
 * </LimitCheckWrapper>
 * ```
 */

interface LimitCheckWrapperProps {
  /**
   * Resource to check limits for
   */
  resource:
    | "workspaces"
    | "topics"
    | "knowledge_items"
    | "ai_requests"
    | "storage";

  /**
   * Name of the action (for messages)
   */
  actionName: string;

  /**
   * Children - typically a button or form
   */
  children: ReactNode;

  /**
   * Callback when limit is reached and user tries to proceed
   * Useful for analytics or custom handling
   */
  onLimitReached?: () => void;

  /**
   * Show warning when close to limit (at 75%)
   * @default true
   */
  showWarning?: boolean;

  /**
   * Custom className
   */
  className?: string;
}

export function LimitCheckWrapper({
  resource,
  actionName: _actionName,
  children,
  showWarning = true,
  className = "",
}: LimitCheckWrapperProps) {
  const router = useRouter();
  const { isLimitReached, usagePercentage } = useResourceLimit(resource);

  const handleUpgrade = () => {
    router.push("/pricing" as Route);
  };

  // Block actions if limit is reached
  if (isLimitReached) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertTitle>Limit Reached</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              You've reached the maximum number of {resource.replace(/_/g, " ")}{" "}
              allowed on your current plan.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleUpgrade}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Upgrade Plan
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("/dashboard/subscription" as Route)}
              >
                View Usage
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        {/* Render disabled version of children */}
        <div className="opacity-50 pointer-events-none mt-4">{children}</div>
      </div>
    );
  }

  // Show warning if approaching limit
  const isApproachingLimit = usagePercentage >= 75;

  if (showWarning && isApproachingLimit && !isLimitReached) {
    return (
      <div className={className}>
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">
              You're using <strong>{usagePercentage.toFixed(0)}%</strong> of
              your {resource.replace(/_/g, " ")} limit.
            </span>
            <Button size="sm" variant="outline" onClick={handleUpgrade}>
              Upgrade
            </Button>
          </AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }

  // Render normally if under limit
  return <div className={className}>{children}</div>;
}

/**
 * Hook to programmatically check and handle limits
 * Use this in forms or before API calls
 */
export function useCheckLimit(
  resource:
    | "workspaces"
    | "topics"
    | "knowledge_items"
    | "ai_requests"
    | "storage",
) {
  const router = useRouter();
  const { isLimitReached, usagePercentage, canCreate } =
    useResourceLimit(resource);

  const checkLimit = (actionName: string = "perform this action"): boolean => {
    if (isLimitReached) {
      toast.error("Limit Reached", {
        description: `You've reached your plan's limit. Upgrade to ${actionName}.`,
        action: {
          label: "Upgrade",
          onClick: () => router.push("/pricing" as Route),
        },
      });
      return false;
    }
    return true;
  };

  const warnIfApproaching = (threshold: number = 75): boolean => {
    if (usagePercentage >= threshold && !isLimitReached) {
      toast.warning("Approaching Limit", {
        description: `You're using ${usagePercentage.toFixed(0)}% of your ${resource.replace(/_/g, " ")} limit.`,
        action: {
          label: "Upgrade",
          onClick: () => router.push("/pricing" as Route),
        },
      });
      return true;
    }
    return false;
  };

  return {
    isLimitReached,
    usagePercentage,
    canCreate,
    checkLimit,
    warnIfApproaching,
  };
}

/**
 * Example Usage in a Component:
 *
 * ```tsx
 * // Wrapper approach (simplest)
 * function WorkspaceCreateButton() {
 *   return (
 *     <LimitCheckWrapper resource="workspaces" actionName="Create Workspace">
 *       <Button onClick={handleCreate}>
 *         <Plus className="mr-2 h-4 w-4" />
 *         Create Workspace
 *       </Button>
 *     </LimitCheckWrapper>
 *   );
 * }
 *
 * // Hook approach (for complex logic)
 * function CreateWorkspaceForm() {
 *   const { checkLimit, warnIfApproaching } = useCheckLimit("workspaces");
 *
 *   const handleSubmit = async (data) => {
 *     // Check limit before submitting
 *     if (!checkLimit("create a workspace")) {
 *       return;
 *     }
 *
 *     // Proceed with creation
 *     await createWorkspace(data);
 *   };
 *
 *   useEffect(() => {
 *     // Warn when form is opened
 *     warnIfApproaching(80);
 *   }, []);
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
