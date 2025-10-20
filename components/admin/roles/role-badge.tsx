import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RoleBadgeProps {
  isSystemRole: boolean;
}

export function RoleBadge({ isSystemRole }: RoleBadgeProps) {
  if (!isSystemRole) {
    return null;
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <Shield className="h-3 w-3" />
      System
    </Badge>
  );
}
