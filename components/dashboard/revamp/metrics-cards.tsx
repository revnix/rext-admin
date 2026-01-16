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
      <Card className="shadow-none border-none bg-primary text-primary-foreground rounded-2xl relative overflow-hidden group">
        <CardContent className="p-8 flex flex-col justify-between h-full min-h-[180px] relative z-10">
          <div className="flex justify-between items-start">
            <span className="font-medium text-lg opacity-90">
              Total Content
            </span>
            <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-colors">
              <ArrowUpRight className="h-5 w-5 text-white" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-5xl font-bold tracking-tight">
              {totalContent}
            </div>
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-sm font-medium w-fit backdrop-blur-md">
              <div className="bg-green-400/20 text-green-300 p-0.5 rounded-full">
                <TrendingUp className="h-3 w-3" />
              </div>
              <span className="text-white">+3 from last week</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust Score */}
      <Card className="shadow-none border border-slate-100 bg-white rounded-2xl transition-all duration-300 hover:border-slate-300 group">
        <CardContent className="p-8 flex flex-col justify-between h-full min-h-[180px]">
          <div className="flex justify-between items-start">
            <span className="font-semibold text-lg text-slate-700">
              Trust Score
            </span>
            <div className="h-10 w-10 border border-slate-200 rounded-full flex items-center justify-center group-hover:border-slate-900 group-hover:bg-slate-900 transition-all">
              <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-5xl font-bold text-slate-900">
              {trustScore}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Personas */}
      <Card className="shadow-none border border-slate-100 bg-white rounded-2xl transition-all duration-300 hover:border-slate-300 group">
        <CardContent className="p-8 flex flex-col justify-between h-full min-h-[180px]">
          <div className="flex justify-between items-start">
            <span className="font-semibold text-lg text-slate-700">
              Active Personas
            </span>
            <div className="h-10 w-10 border border-slate-200 rounded-full flex items-center justify-center group-hover:border-slate-900 group-hover:bg-slate-900 transition-all">
              <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-5xl font-bold text-slate-900">
              {activePersonas}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Publish Success */}
      <Card className="shadow-none border border-slate-100 bg-white rounded-2xl transition-all duration-300 hover:border-slate-300 group overflow-hidden">
        <CardContent className="p-8 flex flex-col justify-between h-full min-h-[180px] relative">
          <div className="flex justify-between items-start relative z-10">
            <span className="font-semibold text-lg text-slate-700">
              Publish Success
            </span>
            <div className="h-10 w-10 border border-slate-200 rounded-full flex items-center justify-center group-hover:border-slate-900 group-hover:bg-slate-900 transition-all">
              <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
            </div>
          </div>

          <div className="space-y-1 relative z-10">
            <div className="text-5xl font-bold text-slate-900">
              {publishSuccess}
              <span className="text-3xl text-slate-400">%</span>
            </div>
            <div className="text-sm text-slate-500 font-medium">
              Last 30 days
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
