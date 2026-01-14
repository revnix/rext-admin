import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, TrendingUp } from "lucide-react";
import type { Workspace } from "@/types/workspace";

interface MetricsCardsProps {
  workspace: Workspace | null;
}

export function MetricsCards({ workspace }: MetricsCardsProps) {
  // Mock data for new metrics not yet in backend
  const totalContent = workspace?.content_count ?? 24;
  const trustScore = 87; // Mock
  const activePersonas = 5; // Mock
  const publishSuccess = 98; // Mock

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Content */}
      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">
            Total Content
          </CardTitle>
          <FileText className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalContent}</div>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="text-green-600 font-medium">+3</span> from last
            week
          </p>
          <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-slate-800 w-[70%]" />
          </div>
        </CardContent>
      </Card>

      {/* Trust Score */}
      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">Trust Score</CardTitle>
          <TrendingUp className="h-5 w-5 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{trustScore}%</div>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="text-yellow-600 font-medium">+5%</span> from last
            month
          </p>
          <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 w-[87%]" />
          </div>
        </CardContent>
      </Card>

      {/* Active Personas */}
      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">
            Active Personas
          </CardTitle>
          <Users className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{activePersonas}</div>
          <p className="text-sm text-muted-foreground mt-1">2 pending review</p>
          <p className="text-sm text-teal-700 mt-3 font-medium cursor-pointer hover:underline">
            Manage Personas →
          </p>
        </CardContent>
      </Card>

      {/* Publish Success */}
      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">
            Publish Success
          </CardTitle>
          <TrendingUp className="h-5 w-5 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{publishSuccess}%</div>
          <p className="text-sm text-muted-foreground mt-1">Last 30 days</p>
          <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-700 w-[98%]" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
