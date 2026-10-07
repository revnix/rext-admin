import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PermissionBadgeProps {
  resource: string;
  action: string;
  className?: string;
}

// A permission's resource is an attribute, not a status: one neutral badge for all
// (design/app-language.md §2), the resource and action in the monospace face.
export function PermissionBadge({
  resource,
  action,
  className,
}: PermissionBadgeProps) {
  return (
    <Badge variant="neutral" className={cn("font-mono text-xs", className)}>
      {resource}.{action}
    </Badge>
  );
}
