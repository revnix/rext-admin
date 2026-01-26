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
      color: "text-muted-foreground",
    },
    {
      label: "Drafting",
      value: 5,
      sub: "Avg: 3 days",
      icon: FileEdit,
      color: "text-muted-foreground",
    },
    {
      label: "EEAT Review",
      value: 3,
      sub: "Needs attention",
      highlight: true,
      icon: Clock,
      color: "text-foreground",
      bg: "bg-card border-border shadow-sm",
    },
    {
      label: "Scheduled",
      value: 4,
      sub: "Next: Today",
      icon: Calendar,
      color: "text-muted-foreground",
    },
    {
      label: "Published",
      value: 24,
      sub: "+12.5%",
      trend: true,
      icon: CheckCircle2,
      color: "text-foreground",
    },
  ];

  return (
    <Card className="shadow-none border border-border bg-card rounded-2xl">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-xl font-bold text-foreground">
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
                  ? "bg-card border-border"
                  : "bg-muted/40 border-border/50 hover:border-foreground/20"
              } flex flex-col justify-between min-h-[140px]`}
            >
              <div className="flex justify-between items-start mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                {stat.highlight && (
                  <span className="h-2 w-2 rounded-full bg-foreground animate-pulse" />
                )}
              </div>

              <div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {stat.label}
                </p>

                <div
                  className={`text-xs font-medium px-2 py-1 rounded-full w-fit ${stat.trend ? "bg-muted text-foreground" : stat.highlight ? "bg-muted text-foreground" : "bg-card text-muted-foreground"}`}
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
