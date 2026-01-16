"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface RecommendationCardProps {
  onImport: () => void;
}

export function RecommendationCard({ onImport }: RecommendationCardProps) {
  return (
    <Card className="bg-sky-50/30 border-sky-200/60 shadow-none relative overflow-hidden rounded-2xl group">
      <div className="absolute inset-0 bg-gradient-to-r from-sky-50/50 to-transparent opacity-50" />
      <CardContent className="p-6 md:p-8 relative">
        <div className="absolute top-4 right-4">
          <Badge className="bg-white/80 text-sky-700 hover:bg-white border-sky-200 backdrop-blur-sm rounded-lg shadow-none font-semibold tracking-wide">
            RECOMMENDED
          </Badge>
        </div>

        <div className="mb-6 flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-sky-100 flex items-center justify-center border border-sky-200 text-2xl shadow-none shrink-0">
            🤖
          </div>
          <div>
            <h3 className="font-bold text-xl text-slate-900 mb-1">
              Dr. Wrext Expert
            </h3>
            <p className="text-sky-700 font-medium">
              Lead Content Strategist
            </p>
          </div>
        </div>

        <p className="text-slate-600 mb-6 max-w-2xl leading-relaxed text-base">
          With over a decade of experience in the industry, Dr. Wrext Expert
          leads the brand's commitment to high-quality, trustworthy content,
          specializing in authoritative, data-driven narratives.
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          <Badge className="bg-white text-slate-600 hover:bg-slate-50 border-sky-100 rounded-lg px-3 py-1 font-medium shadow-none">
            Product Design
          </Badge>
          <Badge className="bg-white text-slate-600 hover:bg-slate-50 border-sky-100 rounded-lg px-3 py-1 font-medium shadow-none">
            Market Research
          </Badge>
          <Badge className="bg-white text-slate-600 hover:bg-slate-50 border-sky-100 rounded-lg px-3 py-1 font-medium shadow-none">
            Consumer Psychology
          </Badge>
        </div>

        <Button
          onClick={onImport}
          className="w-full md:w-auto bg-sky-600 hover:bg-sky-700 text-white border-transparent hover:shadow-none transition-all rounded-xl h-11 px-6 font-medium"
        >
          <Plus size={18} className="mr-2" />
          Import Persona
        </Button>
      </CardContent>
    </Card>
  );
}
