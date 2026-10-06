import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PermissionBadgeProps {
  resource: string;
  action: string;
  className?: string;
}

const resourceColors: Record<string, string> = {
  user: "bg-blue-100 text-blue-800 border-blue-200",
  role: "bg-purple-100 text-purple-800 border-purple-200",
  permission: "bg-pink-100 text-pink-800 border-pink-200",
  workspace: "bg-green-100 text-green-800 border-green-200",
  content: "bg-orange-100 text-orange-800 border-orange-200",
  subscription: "bg-teal-100 text-teal-800 border-teal-200",
  audit: "bg-gray-100 text-gray-800 border-gray-200",
  member: "bg-cyan-100 text-cyan-800 border-cyan-200",
};

export function PermissionBadge({
  resource,
  action,
  className,
}: PermissionBadgeProps) {
  const colorClass =
    resourceColors[resource.toLowerCase()] ||
    "bg-gray-100 text-gray-800 border-gray-200";

  return (
    <Badge
      variant="outline"
      className={cn("font-mono text-xs", colorClass, className)}
    >
      {resource}.{action}
    </Badge>
  );
}
