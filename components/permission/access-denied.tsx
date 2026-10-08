"use client";

import { AlertTriangle, ArrowLeft, HelpCircle, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Route } from "next";

interface AccessDeniedProps {
  /**
   * The permission that was required (e.g., "workspace.update")
   */
  permission?: string;

  /**
   * Custom title for the access denied message
   */
  title?: string;

  /**
   * Custom description for why access was denied
   */
  description?: string;

  /**
   * Role that has this permission (e.g., "Workspace Admin")
   */
  requiredRole?: string;

  /**
   * Whether to show upgrade prompt
   */
  showUpgrade?: boolean;

  /**
   * Custom back URL (defaults to home)
   */
  backUrl?: string;

  /**
   * Variant of the component (card or full-page)
   */
  variant?: "card" | "page";

  /**
   * The route the user attempted to access (e.g., "/subscription")
   * Used to provide context about what they tried to do
   */
  attemptedRoute?: string;
}

/**
 * Access Denied Component
 *
 * Displays a user-friendly access denied message with contextual information
 * about required permissions and upgrade options.
 *
 * @example
 * // Basic usage
 * <AccessDenied permission="workspace.update" />
 *
 * @example
 * // With custom message
 * <AccessDenied
 *   title="Team Plan Required"
 *   description="Upgrade to Team plan to invite members"
 *   showUpgrade
 * />
 *
 * @example
 * // Full page variant
 * <AccessDenied variant="page" permission="admin.access" />
 */
export function AccessDenied({
  permission,
  title,
  description,
  requiredRole,
  showUpgrade = false,
  backUrl = "/",
  variant = "card",
  attemptedRoute,
}: AccessDeniedProps) {
  const router = useRouter();

  // Default messages based on permission
  const getDefaultTitle = () => {
    if (title) return title;
    if (permission?.includes("admin")) return "Admin Access Required";
    if (permission?.includes("owner") || permission?.includes("billing"))
      return "Owner Access Required";
    if (permission?.includes("workspace")) return "Workspace Admin Required";
    return "Access Denied";
  };

  const getDefaultDescription = () => {
    if (description) return description;
    if (permission?.includes("admin"))
      return "This page is only accessible to platform administrators.";
    if (permission?.includes("owner") || permission?.includes("billing"))
      return "Only workspace owners can access billing and subscription management.";
    if (permission?.includes("workspace"))
      return "This action requires workspace administrator privileges.";
    return "You don't have permission to access this resource. Contact your workspace administrator if you need access.";
  };

  const getRoleHint = () => {
    if (requiredRole) return requiredRole;
    if (permission?.includes("admin")) return "Admin or Super Admin";
    if (permission?.includes("owner") || permission?.includes("billing"))
      return "Workspace Owner";
    if (permission?.includes("workspace.update"))
      return "Workspace Admin or Owner";
    if (permission?.includes("member")) return "Workspace Admin or Owner";
    return null;
  };

  const content = (
    <>
      <div className="flex justify-center mb-4">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <Shield className="h-8 w-8 text-destructive" />
        </div>
      </div>

      <CardHeader className="text-center pb-3">
        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
          <AlertTriangle className="h-6 w-6 text-warning-600" />
          {getDefaultTitle()}
        </CardTitle>
        <CardDescription className="text-base">
          {getDefaultDescription()}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Attempted Route Context */}
        {attemptedRoute && (
          <div className="bg-muted/40 border border-border p-3 rounded-md">
            <p className="text-xs text-foreground mb-1">You tried to access:</p>
            <p className="text-sm font-mono font-semibold text-muted-foreground">
              {attemptedRoute}
            </p>
          </div>
        )}

        {/* Permission Details */}
        {permission && (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-xs text-muted-foreground mb-1">
              Required Permission:
            </p>
            <p className="text-sm font-mono font-semibold">{permission}</p>
          </div>
        )}

        {/* Role Hint */}
        {getRoleHint() && (
          <div className="bg-muted/40 border border-border p-3 rounded-md">
            <p className="text-xs text-foreground mb-1">Who can access:</p>
            <p className="text-sm font-semibold text-muted-foreground">
              {getRoleHint()}
            </p>
          </div>
        )}

        {/* Upgrade Prompt */}
        {showUpgrade && (
          <div className="bg-muted/40 border border-border p-4 rounded-md">
            <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              Need Access?
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Contact your workspace administrator to request access or upgrade
              your role.
            </p>
            <Button
              data-rec="show"
              size="sm"
              variant="outline"
              asChild
              className="w-full"
            >
              <Link href="/w" aria-label="View My Workspaces">
                View My Workspaces
              </Link>
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            data-rec="show"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
            aria-label="Go Back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            Go Back
          </Button>
          <Button data-rec="show" asChild className="flex-1">
            <Link href={backUrl as Route} aria-label="Go to Dashboard">
              Go to Dashboard
            </Link>
          </Button>
        </div>

        {/* Help Link */}
        <div className="text-center pt-2">
          <Link
            href="/settings"
            aria-label="Contact Support"
            className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
          >
            Contact Support
          </Link>
        </div>
      </CardContent>
    </>
  );

  if (variant === "page") {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">{content}</Card>
      </div>
    );
  }

  return <Card className="border-destructive">{content}</Card>;
}
