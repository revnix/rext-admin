import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RoleBadgeProps {
  isSystemRole: boolean;
  /**
   * Seeded workspace role (workspace_owner, workspace_admin, editor, viewer).
   * These carry is_system_role = false but the backend still refuses to edit or
   * delete them, so labelling only the platform roles left four rows looking
   * editable when they are not.
   */
  isBuiltIn?: boolean;
}

export function RoleBadge({ isSystemRole, isBuiltIn }: RoleBadgeProps) {
  if (!isSystemRole && !isBuiltIn) {
    return null;
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <Shield className="h-3 w-3" />
      {isSystemRole ? "System" : "Built-in"}
    </Badge>
  );
}
