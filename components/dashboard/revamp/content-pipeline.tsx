import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Circle, Clock, CheckCircle2, FileEdit, Calendar } from "lucide-react";

export function ContentPipeline() {
  // Mock data matching reference
  const stats = [
    {
      label: "Ideation",
      value: 8,
      sub: "Avg: 2 days",
      icon: Circle,
      color: "text-slate-400",
    },
    {
      label: "Drafting",
      value: 5,
      sub: "Avg: 3 days",
      icon: FileEdit,
      color: "text-slate-500",
    },
    {
      label: "EEAT Review",
      value: 3,
      sub: "Needs attention",
      highlight: true,
      icon: Clock,
      color: "text-slate-900",
      bg: "bg-white border-slate-200 shadow-sm",
    },
    {
      label: "Scheduled",
      value: 4,
      sub: "Next: Today",
      icon: Calendar,
      color: "text-slate-500",
    },
    {
      label: "Published",
      value: 24,
      sub: "+12.5%",
      trend: true,
      icon: CheckCircle2,
      color: "text-slate-900",
    },
  ];

  return (
    <Card className="shadow-none border border-slate-100 bg-white rounded-2xl">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-xl font-bold text-slate-800">
          Content Pipeline
        </CardTitle>
        <p className="text-base text-muted-foreground">
          Track your content from ideation to publication
        </p>
      </CardHeader>
      <CardContent className="p-8 pt-2">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {stats.map((stat, _i) => (
            <div
              key={stat.label}
              className={`p-5 rounded-2xl border transition-all duration-200 ${
                stat.highlight
                  ? "bg-white border-slate-200"
                  : "bg-slate-50 border-slate-100 hover:border-slate-200"
              } flex flex-col justify-between min-h-[140px]`}
            >
              <div className="flex justify-between items-start mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                {stat.highlight && (
                  <span className="h-2 w-2 rounded-full bg-slate-900 animate-pulse" />
                )}
              </div>

              <div>
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {stat.value}
                </div>
                <p className="text-sm font-medium text-slate-600 mb-2">
                  {stat.label}
                </p>

                <div
                  className={`text-xs font-medium px-2 py-1 rounded-full w-fit ${stat.trend ? "bg-slate-100 text-slate-700" : stat.highlight ? "bg-slate-100 text-slate-900" : "bg-white text-slate-500"}`}
                >
                  {stat.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
