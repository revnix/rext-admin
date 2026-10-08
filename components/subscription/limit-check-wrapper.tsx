"use client";

import { TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Notice } from "@/components/ui/notice";
import { Button } from "@/components/ui/button";
import { type LimitedResource, useResourceLimit } from "./usage-limit-warning";
import type { Route } from "next";
import { SUBSCRIPTION_ACTION_VARIANTS } from "@/components/subscription/subscription-action-variants";
import { settingsRoutes } from "@/lib/routes";

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
  resource: LimitedResource;

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
  const { isLimitReached, usagePercentage, isLoading } =
    useResourceLimit(resource);

  const handleUpgrade = () => {
    router.push("/pricing" as Route);
  };

  if (isLoading) {
    return (
      <div className={className}>
        <Notice title="Checking plan limits">
          We’re confirming your current plan before enabling this action.
        </Notice>
        <div className="opacity-60 pointer-events-none mt-4">{children}</div>
      </div>
    );
  }

  // Block actions if limit is reached
  if (isLimitReached) {
    return (
      <div className={className}>
        <Notice tone="warning" title="Limit reached">
          <p>
            You've reached the maximum number of {resource.replace(/_/g, " ")}{" "}
            allowed on your current plan.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              data-rec="show"
              size="sm"
              variant={SUBSCRIPTION_ACTION_VARIANTS.upgradePrimary}
              onClick={handleUpgrade}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Upgrade plan
            </Button>

            <Button
              data-rec="show"
              size="sm"
              variant={SUBSCRIPTION_ACTION_VARIANTS.navigateSecondary}
              onClick={() => router.push(settingsRoutes.usage as Route)}
            >
              View usage
            </Button>
          </div>
        </Notice>

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
        <Notice
          tone="warning"
          className="mb-4"
          action={
            <Button
              data-rec="show"
              size="sm"
              variant="outline"
              onClick={handleUpgrade}
            >
              Upgrade
            </Button>
          }
        >
          You're using <strong>{usagePercentage.toFixed(0)}%</strong> of your{" "}
          {resource.replace(/_/g, " ")} limit.
        </Notice>
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
export function useCheckLimit(resource: LimitedResource) {
  const router = useRouter();
  const { isLimitReached, usagePercentage, canCreate, isLoading } =
    useResourceLimit(resource);

  const checkLimit = (actionName: string = "perform this action"): boolean => {
    if (isLoading) {
      return false;
    }

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
    if (isLoading) {
      return false;
    }

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
