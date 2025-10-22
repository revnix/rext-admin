import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-48" />
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {(["metric-1", "metric-2", "metric-3", "metric-4"] as const).map(
          (id) => (
            <Card key={id}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-36" />
              </CardContent>
            </Card>
          ),
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {(["chart-grid-1", "chart-grid-2"] as const).map((id) => (
          <Card key={id}>
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Width Charts */}
      {(["full-width-chart-1", "full-width-chart-2"] as const).map((id) => (
        <Card key={id} className="mb-6">
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
