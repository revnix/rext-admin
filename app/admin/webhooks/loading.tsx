import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Skeleton className="h-10 w-80 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {(
          [
            "webhook-stats-1",
            "webhook-stats-2",
            "webhook-stats-3",
            "webhook-stats-4",
          ] as const
        ).map((id) => (
          <Card key={id}>
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters Card */}
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-48" />
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(
              [
                "webhook-event-1",
                "webhook-event-2",
                "webhook-event-3",
                "webhook-event-4",
                "webhook-event-5",
                "webhook-event-6",
                "webhook-event-7",
                "webhook-event-8",
              ] as const
            ).map((id) => (
              <Skeleton key={id} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
