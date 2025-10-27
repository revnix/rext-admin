import { AccessDenied } from "@/components/permission/access-denied";

/**
 * Unauthorized Page
 *
 * Displayed when a user tries to access a route they don't have permission for.
 * Uses the enhanced AccessDenied component with helpful context from middleware.
 *
 * URL Parameters (passed by middleware):
 * - from: The route the user tried to access (e.g., "/subscription")
 * - required: The permission or role required (e.g., "subscription.read")
 */
export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; required?: string }>;
}) {
  // Extract context from URL parameters (set by middleware)
  const params = await searchParams;
  const attemptedRoute = params.from;
  const requiredPermission = params.required;

  return (
    <AccessDenied
      variant="page"
      showUpgrade
      permission={requiredPermission}
      attemptedRoute={attemptedRoute}
      backUrl={attemptedRoute || "/"}
    />
  );
}
