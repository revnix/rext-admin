"use client";

import {
  Activity,
  Calendar,
  Clock,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DetailCard } from "@/components/ui/detail-card";
import {
  DetailGrid,
  DetailGridItem,
  FourColumnGrid,
  ThreeColumnGrid,
  TwoColumnGrid,
} from "@/components/ui/detail-grid";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/ui/section-header";

/**
 * Example usage of DetailGrid components for flexible layouts
 */
export function DetailGridExamples() {
  return (
    <div className="space-y-8">
      {/* Example 1: Two Column Layout */}
      <div>
        <SectionHeader
          title="Two Column Layout"
          description="Cards arranged in a responsive two-column grid"
          className="mb-6"
        />
        <TwoColumnGrid gap="lg">
          <DetailCard variant="highlight">
            <SectionHeader
              title="Performance Metrics"
              icon={<TrendingUp className="w-5 h-5" />}
              variant="compact"
              className="mb-4"
            />
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Success Rate
                </span>
                <span className="font-medium">98.5%</span>
              </div>
              <Progress value={98.5} className="h-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Avg Response Time
                </span>
                <span className="font-medium">1.2s</span>
              </div>
            </div>
          </DetailCard>

          <DetailCard variant="success">
            <SectionHeader
              title="Recent Activity"
              icon={<Activity className="w-5 h-5" />}
              variant="compact"
              className="mb-4"
            />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm">Flow executed successfully</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm">New user registered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-sm">Alert threshold reached</span>
              </div>
            </div>
          </DetailCard>
        </TwoColumnGrid>
      </div>

      {/* Example 2: Three Column Layout */}
      <div>
        <SectionHeader
          title="Three Column Layout"
          description="Stat cards in a responsive three-column grid"
          className="mb-6"
        />
        <ThreeColumnGrid gap="md">
          <DetailCard variant="default" className="text-center">
            <Users className="w-8 h-8 mx-auto mb-3 text-blue-600" />
            <div className="text-2xl font-bold">1,247</div>
            <div className="text-sm text-muted-foreground">Total Users</div>
          </DetailCard>

          <DetailCard variant="default" className="text-center">
            <Activity className="w-8 h-8 mx-auto mb-3 text-green-600" />
            <div className="text-2xl font-bold">89.2%</div>
            <div className="text-sm text-muted-foreground">Uptime</div>
          </DetailCard>

          <DetailCard variant="default" className="text-center">
            <Clock className="w-8 h-8 mx-auto mb-3 text-purple-600" />
            <div className="text-2xl font-bold">2.1s</div>
            <div className="text-sm text-muted-foreground">Avg Response</div>
          </DetailCard>
        </ThreeColumnGrid>
      </div>

      {/* Example 3: Four Column Layout */}
      <div>
        <SectionHeader
          title="Four Column Layout"
          description="Small stat cards in a responsive four-column grid"
          className="mb-6"
        />
        <FourColumnGrid gap="sm">
          {[
            { label: "Active Users", value: "1,234", color: "text-blue-600" },
            {
              label: "Total Revenue",
              value: "$45.2K",
              color: "text-green-600",
            },
            {
              label: "Conversion Rate",
              value: "3.7%",
              color: "text-purple-600",
            },
            { label: "Bounce Rate", value: "23.4%", color: "text-orange-600" },
          ].map((stat) => (
            <DetailCard
              key={stat.label}
              variant="default"
              className="text-center p-4"
            >
              <div className={`text-lg font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {stat.label}
              </div>
            </DetailCard>
          ))}
        </FourColumnGrid>
      </div>

      {/* Example 4: Custom Grid with DetailGridItem */}
      <div>
        <SectionHeader
          title="Custom Grid Layout"
          description="Using DetailGridItem for precise control over column spans"
          className="mb-6"
        />
        <DetailGrid columns={12} gap="md">
          {/* Main content - spans 8 columns on large screens, full width on smaller */}
          <DetailGridItem span={12} responsive={{ lg: 8 }}>
            <DetailCard variant="highlight">
              <SectionHeader
                title="Main Dashboard"
                icon={<Settings className="w-5 h-5" />}
                variant="compact"
                className="mb-4"
              />
              <p className="text-muted-foreground">
                This is the main content area that takes up 8 columns on large
                screens and the full width on smaller screens.
              </p>
            </DetailCard>
          </DetailGridItem>

          {/* Sidebar - spans 4 columns on large screens, full width on smaller */}
          <DetailGridItem span={12} responsive={{ lg: 4 }}>
            <div className="space-y-4">
              <DetailCard variant="info" className="p-4">
                <div className="text-center">
                  <Calendar className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium">Today</div>
                  <div className="text-sm text-muted-foreground">
                    March 15, 2024
                  </div>
                </div>
              </DetailCard>

              <DetailCard variant="warning" className="p-4">
                <div className="text-center">
                  <Badge variant="destructive">3</Badge>
                  <div className="text-sm text-muted-foreground mt-1">
                    Alerts
                  </div>
                </div>
              </DetailCard>
            </div>
          </DetailGridItem>
        </DetailGrid>
      </div>

      {/* Example 5: Mixed Layout */}
      <div>
        <SectionHeader
          title="Mixed Layout"
          description="Combining different column spans for complex layouts"
          className="mb-6"
        />
        <DetailGrid columns={6} gap="lg">
          {/* Full width header */}
          <DetailGridItem span={6}>
            <DetailCard variant="accent" className="p-4">
              <SectionHeader
                title="Section Header"
                description="This spans the full width of the 6-column grid"
                variant="compact"
              />
            </DetailCard>
          </DetailGridItem>

          {/* Two-thirds width */}
          <DetailGridItem span={4}>
            <DetailCard variant="default">
              <SectionHeader
                title="Main Content"
                description="Takes up 4 columns (two-thirds)"
                variant="compact"
                className="mb-4"
              />
              <p className="text-muted-foreground">
                This content area spans 4 out of 6 columns, giving it a
                two-thirds width.
              </p>
            </DetailCard>
          </DetailGridItem>

          {/* One-third width */}
          <DetailGridItem span={2}>
            <DetailCard variant="success" className="p-4">
              <div className="text-center">
                <TrendingUp className="w-6 h-6 mx-auto mb-2" />
                <div className="font-medium">Sidebar</div>
                <div className="text-sm text-muted-foreground">2 columns</div>
              </div>
            </DetailCard>
          </DetailGridItem>

          {/* Three equal columns */}
          <DetailGridItem span={2}>
            <DetailCard variant="default" className="p-3 text-center">
              <div className="font-medium">Col 1</div>
            </DetailCard>
          </DetailGridItem>

          <DetailGridItem span={2}>
            <DetailCard variant="default" className="p-3 text-center">
              <div className="font-medium">Col 2</div>
            </DetailCard>
          </DetailGridItem>

          <DetailGridItem span={2}>
            <DetailCard variant="default" className="p-3 text-center">
              <div className="font-medium">Col 3</div>
            </DetailCard>
          </DetailGridItem>
        </DetailGrid>
      </div>
    </div>
  );
}

export default DetailGridExamples;
