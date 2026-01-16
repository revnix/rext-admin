import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { workspaceRoutes } from "@/lib/routes";
import type { Workspace } from "@/types/workspace";

interface QuickActionsProps {
  workspace: Workspace | null;
}

export function QuickActions({ workspace }: QuickActionsProps) {
  const slug = workspace?.slug || "default";

  const actions = [
    {
      label: "Invite Member",
      icon: UserPlus,
      href: slug !== "default" ? workspaceRoutes.members(slug) : "/members",
      color: "bg-slate-100 text-slate-600",
      border: "border-slate-200",
      hover: "hover:bg-slate-50",
    },
  ];

  return (
    <Card className="shadow-none border border-slate-100 bg-white rounded-2xl overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-xl font-bold text-slate-800">
          Quick Actions
        </CardTitle>
        <p className="text-base text-muted-foreground">
          Common tasks and shortcuts
        </p>
      </CardHeader>
      <CardContent className="p-6 pt-2">
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`flex items-center justify-between p-4 rounded-2xl border ${action.border} bg-white transition-all duration-200 group`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${action.color}`}
                >
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="font-semibold text-slate-700 group-hover:text-slate-900">
                  {action.label}
                </span>
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
