import { AccessDenied } from "@/components/permission/access-denied";

/**
 * Unauthorized Page
 *
 * Displayed when a user tries to access a route they don't have permission for.
 * Uses the enhanced AccessDenied component with helpful context.
 */
export default function UnauthorizedPage() {
  return <AccessDenied variant="page" showUpgrade />;
}
