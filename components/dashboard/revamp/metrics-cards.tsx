"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, ArrowUpRight } from "lucide-react";
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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Content - Primary Card (Dark Blue) */}
      <Card className="border-none bg-primary text-primary-foreground relative overflow-hidden group shadow-colored-primary-md">
        <CardContent className="p-8 flex flex-col justify-between h-full min-h-[180px] relative z-10">
          <div className="flex justify-between items-start">
            <span className="font-medium text-lg text-white/90">
              Total Content
            </span>
            <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-colors">
              <ArrowUpRight className="h-5 w-5 text-white" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-5xl font-bold tracking-tight text-white">
              {totalContent}
            </div>
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-md text-sm font-medium w-fit backdrop-blur-md">
              <div className="bg-green-400/20 text-green-300 p-0.5 rounded-md">
                <TrendingUp className="h-3 w-3" />
              </div>
              <span className="text-white">+3 from last week</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust Score */}
      <Card className="border border-border bg-card transition-all duration-300 hover:border-foreground/20 group">
        <CardContent className="p-8 flex flex-col justify-between h-full min-h-[180px]">
          <div className="flex justify-between items-start">
            <span className="font-semibold text-lg text-muted-foreground group-hover:text-foreground transition-colors">
              Trust Score
            </span>
            <div className="h-10 w-10 border border-border rounded-full flex items-center justify-center group-hover:border-foreground group-hover:bg-foreground transition-all">
              <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-background transition-colors" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-5xl font-bold text-foreground">
              {trustScore}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Personas */}
      <Card className="border border-border bg-card transition-all duration-300 hover:border-foreground/20 group">
        <CardContent className="p-8 flex flex-col justify-between h-full min-h-[180px]">
          <div className="flex justify-between items-start">
            <span className="font-semibold text-lg text-muted-foreground group-hover:text-foreground transition-colors">
              Active Personas
            </span>
            <div className="h-10 w-10 border border-border rounded-full flex items-center justify-center group-hover:border-foreground group-hover:bg-foreground transition-all">
              <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-background transition-colors" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-5xl font-bold text-foreground">
              {activePersonas}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Publish Success */}
      <Card className="border border-border bg-card transition-all duration-300 hover:border-foreground/20 group overflow-hidden">
        <CardContent className="p-8 flex flex-col justify-between h-full min-h-[180px] relative">
          <div className="flex justify-between items-start relative z-10">
            <span className="font-semibold text-lg text-muted-foreground group-hover:text-foreground transition-colors">
              Publish Success
            </span>
            <div className="h-10 w-10 border border-border rounded-full flex items-center justify-center group-hover:border-foreground group-hover:bg-foreground transition-all">
              <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-background transition-colors" />
            </div>
          </div>

          <div className="space-y-1 relative z-10">
            <div className="text-5xl font-bold text-foreground">
              {publishSuccess}
              <span className="text-3xl text-muted-foreground">%</span>
            </div>
            <div className="text-sm text-muted-foreground font-medium">
              Last 30 days
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
