import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ContentPipeline() {
  // Mock data matching reference
  const stats = [
    { label: "Ideation", value: 8, sub: "Avg: 2 days", highlight: false },
    { label: "Drafting", value: 5, sub: "Avg: 3 days", highlight: false },
    {
      label: "EEAT Review",
      value: 3,
      sub: "Needs attention",
      highlight: true,
      color: "bg-orange-50 border-orange-200 text-orange-700",
    },
    { label: "Scheduled", value: 4, sub: "Next: Today", highlight: false },
    {
      label: "Published",
      value: 24,
      sub: "+12.5%",
      highlight: false,
      trend: true,
    },
  ];

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          Content Pipeline
        </CardTitle>
        <p className="text-base text-muted-foreground">
          Track your content from ideation to publication
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats.map((stat, _i) => (
            <div
              key={stat.label}
              className={`p-4 rounded-lg border ${
                stat.highlight
                  ? "bg-amber-50 border-amber-200"
                  : "bg-transparent border-transparent"
              } flex flex-col justify-between`}
            >
              <div>
                <p
                  className={`text-base font-medium mb-2 ${
                    stat.highlight ? "text-amber-700" : "text-muted-foreground"
                  }`}
                >
                  {stat.label}
                </p>
                <div className="text-4xl font-bold">{stat.value}</div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                {stat.highlight && <span className="mr-1">⚠️</span>}
                <span
                  className={
                    stat.trend
                      ? "text-green-600 font-medium"
                      : "text-muted-foreground"
                  }
                >
                  {stat.sub}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
