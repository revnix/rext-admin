"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreVertical } from "lucide-react";

export function DashboardCharts() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Chart 1: Content Growth (Mocking "Churn Rate" style) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">
              Content Growth
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              New articles per week
            </p>
          </div>
          <MoreVertical className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-bold">4.26%</span>
            <p className="text-xs text-red-500 font-medium">
              0.31%{" "}
              <span className="text-muted-foreground font-normal">
                than last week
              </span>
            </p>
          </div>
          {/* SVG Mock for Line Chart */}
          <div className="h-[60px] w-full mt-4 flex items-end justify-between gap-1">
            <svg
              viewBox="0 0 100 40"
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
              role="img"
              aria-label="Bounce rate trend chart"
            >
              <defs>
                <linearGradient id="redGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,35 Q20,38 40,25 T80,30 T100,10"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
              />
              <path
                d="M0,35 Q20,38 40,25 T80,30 T100,10 V40 H0 Z"
                fill="url(#redGradient)"
                stroke="none"
              />
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Chart 2: User Growth (Mocking "User Growth" style) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">
              Audience Reach
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              New visitors website + mobile
            </p>
          </div>
          <MoreVertical className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-bold">3,768</span>
            <p className="text-xs text-green-500 font-medium">
              +3.85%{" "}
              <span className="text-muted-foreground font-normal">
                than last week
              </span>
            </p>
          </div>
          {/* SVG Mock for Green Line Chart */}
          <div className="h-[60px] w-full mt-4 flex items-end justify-between gap-1">
            <svg
              viewBox="0 0 100 40"
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
              role="img"
              aria-label="Session duration trend chart"
            >
              <path
                d="M0,35 Q30,35 50,20 T100,5"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2"
              />
              <linearGradient id="greenGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
              </linearGradient>
              <path
                d="M0,35 Q30,35 50,20 T100,5 V40 H0 Z"
                fill="url(#greenGradient)"
                stroke="none"
              />
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Chart 3: Product Performance / List (Mocking "Product Performance" style - simplified) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
          <CardTitle className="text-base font-semibold">
            Top Performing
          </CardTitle>
          <MoreVertical className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <p className="text-sm rounded-md bg-muted px-2 py-1 inline-block">
                Daily Content
              </p>
            </div>
            <div className="flex -space-x-2">
              <div className="h-8 w-8 rounded-full bg-slate-200 border-2 border-background"></div>
              <div className="h-8 w-8 rounded-full bg-slate-300 border-2 border-background"></div>
              <div className="h-8 w-8 rounded-full bg-slate-400 border-2 border-background flex items-center justify-center text-[10px] text-white">
                10+
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              Added last month
            </div>
            <div className="text-2xl font-bold">8,490</div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Wide Chart: Conversion Funnel (Mocking "Conversion Funnel" style) */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
          <CardTitle className="text-base font-semibold">
            Content Engagement
          </CardTitle>
          <MoreVertical className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-blue-600"></div>
              <span className="text-xs text-muted-foreground">Views</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-blue-400"></div>
              <span className="text-xs text-muted-foreground">Clicks</span>
            </div>
          </div>
          {/* Simple Bar Chart Mock */}
          <div className="h-[200px] w-full flex items-end justify-between gap-4 mt-6 px-2">
            {[40, 65, 50, 75, 45, 60, 70, 55, 60, 65, 50, 60, 65, 75, 55].map(
              (h) => (
                <div
                  key={`bar-${h}-${h}`}
                  className="w-full bg-blue-100 rounded-t-md relative group h-full flex items-end"
                >
                  <div
                    className="w-full bg-blue-600 rounded-t-md transition-all duration-300 hover:opacity-80 absolute bottom-0"
                    style={{ height: `${h}%` }}
                  ></div>
                  <div
                    className="w-full bg-blue-400 rounded-t-md transition-all duration-300 hover:opacity-80 absolute bottom-0 mb-[1px]"
                    style={{ height: `${h * 0.6}%` }}
                  ></div>
                </div>
              ),
            )}
          </div>
        </CardContent>
      </Card>

      {/* Right Column Stack: Total New Users Chart style */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              Total New Readers
            </p>
            <h3 className="text-2xl font-bold">5.9K</h3>
          </div>
          <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
            + 0.52%
          </span>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {/* Wave Area Chart Mock */}
          <div className="h-[150px] w-full mt-4">
            <svg
              viewBox="0 0 100 50"
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
              role="img"
              aria-label="New readers trend chart"
            >
              <path
                d="M0,35 Q25,25 50,30 T100,20 V50 H0 Z"
                fill="#eff6ff"
                stroke="none"
              />
              <path
                d="M0,35 Q25,25 50,30 T100,20"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
              />
            </svg>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
