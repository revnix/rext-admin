import { Lock } from "lucide-react";
import type { MouseEvent, ReactElement, ReactNode } from "react";
import { cloneElement } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const NATIVE_DISABLEABLE_TAGS = new Set([
  "button",
  "input",
  "select",
  "textarea",
  "option",
  "optgroup",
  "fieldset",
]);

type DisableableChildProps = {
  className?: string;
  disabled?: boolean;
  "aria-disabled"?: "true" | "false";
  tabIndex?: number;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
};

interface LockedFeatureTooltipProps {
  /**
   * The permission required to access this feature
   */
  permission?: string;

  /**
   * The role required to access this feature
   */
  requiredRole?: string;

  /**
   * Custom tooltip message
   */
  message?: string;

  /**
   * The element to wrap (must be a single React element)
   */
  children: ReactElement;

  /**
   * Whether to show the lock icon
   */
  showIcon?: boolean;
}

/**
 * Locked Feature Tooltip Component
 *
 * Wraps a disabled element with a tooltip explaining why it's locked
 * and what permission/role is required to access it.
 *
 * @example
 * // Basic usage with permission
 * <LockedFeatureTooltip permission="content.delete">
 *   <Button disabled>Delete</Button>
 * </LockedFeatureTooltip>
 *
 * @example
 * // With custom message
 * <LockedFeatureTooltip
 *   message="Upgrade to Pro plan to use this feature"
 *   showIcon
 * >
 *   <Button disabled>Export Data</Button>
 * </LockedFeatureTooltip>
 *
 * @example
 * // With required role
 * <LockedFeatureTooltip requiredRole="Workspace Owner">
 *   <Button disabled>Manage Billing</Button>
 * </LockedFeatureTooltip>
 */
export function LockedFeatureTooltip({
  permission,
  requiredRole,
  message,
  children,
  showIcon = false,
}: LockedFeatureTooltipProps) {
  // Generate default message based on permission/role
  const getTooltipMessage = (): ReactNode => {
    if (message) return message;

    if (permission && requiredRole) {
      return (
        <div className="space-y-1">
          <p className="font-medium">Permission Required</p>
          <p className="text-xs opacity-90">
            Role: <span className="font-semibold">{requiredRole}</span>
          </p>
          <p className="text-xs opacity-80 font-mono">{permission}</p>
        </div>
      );
    }

    if (permission) {
      // Smart role inference from permission name
      const roleHint = getRoleHintFromPermission(permission);
      return (
        <div className="space-y-1">
          <p className="font-medium">Permission Required</p>
          {roleHint && (
            <p className="text-xs opacity-90">
              Required role: <span className="font-semibold">{roleHint}</span>
            </p>
          )}
          <p className="text-xs opacity-80 font-mono">{permission}</p>
        </div>
      );
    }

    if (requiredRole) {
      return (
        <div className="space-y-1">
          <p className="font-medium">Access Restricted</p>
          <p className="text-xs opacity-90">
            Required role: <span className="font-semibold">{requiredRole}</span>
          </p>
        </div>
      );
    }

    return "You don't have permission to access this feature";
  };

  // Infer role from permission name
  const getRoleHintFromPermission = (perm: string): string | null => {
    if (perm.includes("admin")) return "Admin or Super Admin";
    if (perm.includes("workspace.manage") || perm.includes("workspace.delete"))
      return "Workspace Owner";
    if (
      perm.includes("workspace.update") ||
      perm.includes("member") ||
      perm.includes("role")
    )
      return "Workspace Admin or Owner";
    if (perm.includes("subscription") || perm.includes("billing"))
      return "Workspace Owner";
    if (perm.includes("content.publish") || perm.includes("content.approve"))
      return "Editor or Admin";
    return null;
  };

  // Clone the child element and ensure it's disabled
  function canUseNativeDisabled(
    child: ReactElement,
  ): child is ReactElement<DisableableChildProps> {
    return (
      typeof child.type === "string" && NATIVE_DISABLEABLE_TAGS.has(child.type)
    );
  }

  // Clone the child element and apply disabled semantics safely
  const child = children as ReactElement<DisableableChildProps>;
  const mergedClassName = [
    child.props.className,
    "cursor-not-allowed opacity-60",
  ]
    .filter(Boolean)
    .join(" ");

  const sharedDisabledProps: DisableableChildProps = {
    "aria-disabled": "true",
    tabIndex: -1,
    className: mergedClassName,
    onClick: (event) => {
      event.preventDefault();
      event.stopPropagation();
    },
  };

  const disabledChild = canUseNativeDisabled(child)
    ? cloneElement(child, { ...sharedDisabledProps, disabled: true })
    : cloneElement(child, sharedDisabledProps);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1.5">
          {disabledChild}
          {showIcon && (
            <Lock className="h-3 w-3 text-muted-foreground opacity-60" />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-xs bg-gray-900 text-white border-gray-700"
      >
        {getTooltipMessage()}
      </TooltipContent>
    </Tooltip>
  );
}
