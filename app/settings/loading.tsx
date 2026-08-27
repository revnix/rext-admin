import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Settings page loading state
 *
 * NOTE: This loading.tsx renders inside the settings layout.tsx which already
 * provides the PageLayout (sidebar, header, SettingsNav tabs).
 * Do NOT wrap this in <PageLayout> or <RouteLoading> — that causes a double
 * layout flash (nested header + tabs shift) during tab navigation.
 */
export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Settings form skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {Array.from({ length: 4 }, (_, i) => i).map((i) => (
            <div key={`form-field-${i}`} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-3 w-64" />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>

      {/* Additional settings section skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => i).map((i) => (
            <div
              key={`settings-option-${i}`}
              className="flex items-center justify-between py-2"
            >
              <div className="space-y-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
